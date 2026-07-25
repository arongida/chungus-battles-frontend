import { AfterViewInit, Directive, effect, ElementRef, inject, Input, NgZone, OnDestroy, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PanelLayoutService } from '../services/panel-layout.service';

/** Per-group ordering counter driving the persistent "last-touched panel on top" raise.
 *  Module-level so sibling panels in the same group order against each other. Kept bounded
 *  by renormalizeGroup() — it never grows past MAX_RAISE_STEPS. */
const raiseCounters = new Map<string, number>();

@Directive({
  selector: '[appDraggablePanel]',
  standalone: true,
})
export class DraggablePanelDirective implements AfterViewInit, OnDestroy {
  @Input() dragHandleSelector?: string;
  @Input() initialLeft?: number;
  @Input() panelId?: string;

  /** Enables the persistent raise ("last-touched panel on top"). While raised, the panel's
   *  z-index stays inside [base + 1, base + MAX_RAISE_STEPS]. Leave undefined to opt out
   *  (the directive never writes z-index at all). */
  @Input() raiseZIndexBase?: number;
  /** Panels sharing a group are ordered against each other. Every panel in a group must pass
   *  the same raiseZIndexBase — renormalizeGroup() assumes a single shared base. Defaults to
   *  a group keyed off the base itself, so panels sharing a base without an explicit group
   *  still order correctly. */
  @Input() raiseGroup?: string;

  private readonly el = inject(ElementRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly panelLayoutService = inject(PanelLayoutService);
  private readonly zone = inject(NgZone);

  /** The one pointer we are following. null = no drag in flight. */
  private activePointerId: number | null = null;
  private hasMoved = false;
  private startX = 0;
  private startY = 0;
  private startLeft = 0;
  private startTop = 0;
  private threshold = DraggablePanelDirective.DRAG_THRESHOLD_MOUSE;

  /** rAF batching so we write layout at most once per frame during a drag. */
  private pendingX = 0;
  private pendingY = 0;
  private rafId = 0;

  /** performance.now() deadline before which a click on this panel gets swallowed, once. */
  private suppressClickUntil = 0;

  private static readonly DRAG_THRESHOLD_MOUSE = 4;
  private static readonly DRAG_THRESHOLD_TOUCH = 10;
  private static readonly CLICK_SUPPRESS_MS = 400;
  /** Width of the z-index band above raiseZIndexBase. Small on purpose: it caps how far a
   *  raised panel can ever climb, which is what keeps it safely under the CDK overlay
   *  container (z-index 800) for panels raised at low bases. */
  private static readonly MAX_RAISE_STEPS = 9;

  constructor() {
    // Watch for layout resets and un-pin this panel so it falls back to default CSS.
    // Skip the initial emission (tick === 0) so we don't clear positions on first render.
    effect(() => {
      const tick = this.panelLayoutService.resetTick();
      if (tick === 0) return;
      const panel = this.el.nativeElement as HTMLElement;
      panel.style.position = '';
      panel.style.left = '';
      panel.style.top = '';
      panel.style.transform = '';
      panel.style.bottom = '';
      panel.style.right = '';
      panel.style.zIndex = '';
      this.forgetRaise();
    });
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const panel = this.el.nativeElement as HTMLElement;

    // Restore a previously saved position (clamped to the current viewport).
    if (this.panelId) {
      const saved = this.panelLayoutService.getPosition(this.panelId);
      if (saved) {
        // Wait one frame so the panel has rendered and offsetWidth/Height are accurate.
        requestAnimationFrame(() => {
          const { left, top } = this.clamp(saved.left, saved.top);
          this.applyFixedPosition(left, top);
        });
      }
    }

    // Legacy input kept for backwards compat (not used by fight-room currently).
    if (this.initialLeft !== undefined) {
      panel.style.left = `${this.initialLeft}px`;
    }

    // Outside the zone: a drag fires pointermove at display rate and none of these handlers
    // write Angular state, so there's nothing to change-detect. This alone removes most of
    // the drag jank on mobile during combat, where CD is already expensive.
    this.zone.runOutsideAngular(() => {
      // Event delegation: listeners on the panel root so they survive inner DOM swaps
      // (e.g. compact ↔ detailed toggle that replaces the .cd-header child). Pointer capture
      // (set in onPointerDown) routes move/up/cancel here too, so no document-level listeners
      // are needed and none can leak.
      panel.addEventListener('pointerdown', this.onPointerDown);
      panel.addEventListener('pointermove', this.onPointerMove);
      panel.addEventListener('pointerup', this.onPointerEnd);
      panel.addEventListener('pointercancel', this.onPointerEnd);
      panel.addEventListener('lostpointercapture', this.onPointerEnd);
      // Capture phase so this runs before the inner (click)="expand()" / (click)="collapse()".
      panel.addEventListener('click', this.onClickCapture, true);

      // Re-clamp on resize so a saved panel never ends up off-screen.
      window.addEventListener('resize', this.onWindowResize);
    });
  }

  ngOnDestroy(): void {
    const panel = this.el.nativeElement as HTMLElement;
    panel.removeEventListener('pointerdown', this.onPointerDown);
    panel.removeEventListener('pointermove', this.onPointerMove);
    panel.removeEventListener('pointerup', this.onPointerEnd);
    panel.removeEventListener('pointercancel', this.onPointerEnd);
    panel.removeEventListener('lostpointercapture', this.onPointerEnd);
    panel.removeEventListener('click', this.onClickCapture, true);
    window.removeEventListener('resize', this.onWindowResize);
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.forgetRaise();
  }

  /** Returns true when the event target is within the designated drag handle.
   *  dragHandleSelector may be a comma-separated selector list (e.g. '.cd-header,
   *  .compact-card'), which is how the compact card gets a full-card handle while the
   *  detailed view keeps a header-only one — .compact-card simply doesn't exist in the
   *  detailed DOM, so the handle narrows back down automatically on expand. */
  private isInHandle(target: HTMLElement): boolean {
    if (!this.dragHandleSelector) return true;
    return !!target.closest(this.dragHandleSelector);
  }

  // ── Pointer handling ──────────────────────────────────────────────────────

  private onPointerDown = (e: PointerEvent): void => {
    // Raising has no visible side effect beyond a possible z-index bump, so do it for ANY
    // press on the panel — including presses on the body (inventory, buttons) that will
    // never start a panel drag. Tapping a panel brings it forward, which is what
    // "last-touched panel on top" means to a user.
    this.raise();

    if (this.activePointerId !== null) return; // a second finger while a drag is already live
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    const target = e.target as HTMLElement;
    if (!this.isInHandle(target)) return;
    if (target.closest('button, a, input, select, textarea')) return;

    // Mouse/pen only: kill text selection and native image drag. NEVER on touch — some
    // engines drop the follow-up click when pointerdown is defaultPrevented, which would
    // break tap-to-expand. On touch, touch-action: none on the handle does this job instead.
    if (e.pointerType !== 'touch') e.preventDefault();

    this.activePointerId = e.pointerId;
    this.threshold = e.pointerType === 'mouse'
      ? DraggablePanelDirective.DRAG_THRESHOLD_MOUSE
      : DraggablePanelDirective.DRAG_THRESHOLD_TOUCH;

    const panel = this.el.nativeElement as HTMLElement;
    // Capture redirects every subsequent event for this pointer to the panel, so the drag
    // survives the finger leaving the panel, leaving the window, or the panel's inner DOM
    // being swapped mid-gesture.
    try {
      panel.setPointerCapture(e.pointerId);
    } catch {
      // Pointer already gone (e.g. synthetic/test events) — safe to ignore.
    }

    const rect = panel.getBoundingClientRect();
    this.hasMoved = false;
    this.startX = e.clientX;
    this.startY = e.clientY;
    this.startLeft = rect.left;
    this.startTop = rect.top;
  };

  private onPointerMove = (e: PointerEvent): void => {
    if (e.pointerId !== this.activePointerId) return;
    this.pendingX = e.clientX;
    this.pendingY = e.clientY;
    if (this.rafId) return;
    this.rafId = requestAnimationFrame(this.flushMove);
  };

  private flushMove = (): void => {
    this.rafId = 0;
    this.moveDrag(this.pendingX, this.pendingY);
  };

  /** pointerup, pointercancel (browser stole the gesture) and lostpointercapture all land
   *  here. endDrag() is idempotent, so the normal up -> lostpointercapture pair is harmless. */
  private onPointerEnd = (e: PointerEvent): void => {
    if (e.pointerId !== this.activePointerId) return;
    this.endDrag();
  };

  private onClickCapture = (e: MouseEvent): void => {
    if (performance.now() >= this.suppressClickUntil) return;
    this.suppressClickUntil = 0; // one-shot: consume the guard immediately
    e.stopPropagation();
    e.preventDefault();
  };

  private onWindowResize = (): void => {
    const panel = this.el.nativeElement as HTMLElement;
    // Only re-clamp if the panel is currently fixed (i.e. has been positioned by drag or restore).
    if (panel.style.position !== 'fixed') return;
    const currentLeft = parseFloat(panel.style.left) || 0;
    const currentTop = parseFloat(panel.style.top) || 0;
    const { left, top } = this.clamp(currentLeft, currentTop);
    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
  };

  // ── Drag mechanics ────────────────────────────────────────────────────────

  /** Clamp left/top to keep the panel fully within the viewport. */
  private clamp(left: number, top: number): { left: number; top: number } {
    const panel = this.el.nativeElement as HTMLElement;
    return {
      left: Math.max(0, Math.min(window.innerWidth - panel.offsetWidth, left)),
      top: Math.max(0, Math.min(window.innerHeight - panel.offsetHeight, top)),
    };
  }

  /** Switch the panel to fixed positioning at the given coordinates. */
  private applyFixedPosition(left: number, top: number): void {
    const panel = this.el.nativeElement as HTMLElement;
    panel.style.position = 'fixed';
    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
    panel.style.transform = 'none'; // override any class-based transforms (e.g. translateX(-50%))
    // Use 'auto' (not '') so any CSS-class bottom/right (e.g. .fight-panel-log) is overridden
    // instead of merely unset. Clearing to '' on reset lets the CSS class resume control.
    panel.style.bottom = 'auto';
    panel.style.right = 'auto';
  }

  private moveDrag(x: number, y: number): void {
    if (this.activePointerId === null) return;
    const panel = this.el.nativeElement as HTMLElement;

    if (!this.hasMoved) {
      const dx = x - this.startX;
      const dy = y - this.startY;
      // Radial threshold (not per-axis) so a diagonal wobble behaves the same as an axial one.
      if (dx * dx + dy * dy <= this.threshold * this.threshold) {
        return; // still within the tap threshold — don't pin or move anything yet
      }
      // Crossing the threshold turns this into a real drag: pin the panel at the rect it
      // had when the press started.
      this.hasMoved = true;
      this.applyFixedPosition(this.startLeft, this.startTop);
      panel.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
    }

    const { left, top } = this.clamp(
      this.startLeft + (x - this.startX),
      this.startTop + (y - this.startY),
    );
    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
  }

  private endDrag(): void {
    if (this.activePointerId === null) return; // idempotent — already ended

    // Flush any coordinate still queued for the next frame so the panel lands exactly where
    // the finger/cursor left it.
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
      this.moveDrag(this.pendingX, this.pendingY);
    }

    this.activePointerId = null;
    if (!this.hasMoved) return; // pure click/tap — nothing was pinned, nothing to persist

    document.body.style.userSelect = '';
    const panel = this.el.nativeElement as HTMLElement;
    // Reset inline cursor so the CSS class value takes over again. z-index is deliberately
    // NOT cleared here — the "last-touched panel on top" raise is meant to persist.
    panel.style.cursor = '';

    // Arm the click guard by timestamp instead of a one-shot window listener. On touch the
    // browser often fires no compatibility click at all after a drag, which would leave a
    // {once:true} window listener armed forever, silently swallowing the user's next,
    // completely unrelated tap anywhere on the page.
    this.suppressClickUntil = performance.now() + DraggablePanelDirective.CLICK_SUPPRESS_MS;

    // Persist the final position.
    if (this.panelId) {
      const left = parseFloat(panel.style.left) || 0;
      const top = parseFloat(panel.style.top) || 0;
      this.panelLayoutService.savePosition(this.panelId, { left, top });
    }
  }

  // ── Bounded z-index raise ("last-touched panel on top") ─────────────────────

  /** Moves this panel to the top of its group. The resulting z-index is always in
   *  [base + 1, base + MAX_RAISE_STEPS], so it can never cross into a neighbouring layer
   *  (e.g. the CDK overlay container at 800, cdk-drag-preview at 9999). */
  private raise(): void {
    if (this.raiseZIndexBase === undefined) return;
    const panel = this.el.nativeElement as HTMLElement;
    const group = this.raiseGroup ?? `z${this.raiseZIndexBase}`;

    // Already on top of the group: skip, so repeated taps don't needlessly churn the counter.
    if (
      panel.dataset['raiseGroup'] === group &&
      Number(panel.dataset['raiseOrder']) === raiseCounters.get(group)
    ) {
      return;
    }

    let next = (raiseCounters.get(group) ?? 0) + 1;
    if (next > DraggablePanelDirective.MAX_RAISE_STEPS) {
      this.renormalizeGroup(group);
      next = (raiseCounters.get(group) ?? 0) + 1;
    }
    // Defensive clamp in case a group ever holds more panels than there are steps.
    next = Math.min(next, DraggablePanelDirective.MAX_RAISE_STEPS);

    raiseCounters.set(group, next);
    panel.dataset['raiseGroup'] = group;
    panel.dataset['raiseOrder'] = String(next);
    panel.style.zIndex = String(this.raiseZIndexBase + next);
  }

  /** Compacts a group's orders back to 1..n so the counter can never grow without bound.
   *  Relative stacking is preserved; only the absolute numbers shrink. Panels removed from
   *  the DOM (e.g. by navigation) drop out of the query naturally, so the counter effectively
   *  resets between screens. */
  private renormalizeGroup(group: string): void {
    const raised = Array.from(
      document.querySelectorAll<HTMLElement>(`[data-raise-group="${group}"]`),
    ).sort((a, b) => Number(a.dataset['raiseOrder'] ?? 0) - Number(b.dataset['raiseOrder'] ?? 0));

    raised.forEach((el, i) => {
      const order = i + 1;
      el.dataset['raiseOrder'] = String(order);
      el.style.zIndex = String(this.raiseZIndexBase! + order);
    });
    raiseCounters.set(group, raised.length);
  }

  private forgetRaise(): void {
    const panel = this.el.nativeElement as HTMLElement;
    delete panel.dataset['raiseGroup'];
    delete panel.dataset['raiseOrder'];
  }
}
