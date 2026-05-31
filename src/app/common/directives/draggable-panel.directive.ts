import { AfterViewInit, Directive, effect, ElementRef, inject, Input, OnDestroy, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PanelLayoutService } from '../services/panel-layout.service';

let topZIndex = 1200;

@Directive({
  selector: '[appDraggablePanel]',
  standalone: true,
})
export class DraggablePanelDirective implements AfterViewInit, OnDestroy {
  @Input() dragHandleSelector?: string;
  @Input() initialLeft?: number;
  @Input() panelId?: string;

  private readonly el = inject(ElementRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly panelLayoutService = inject(PanelLayoutService);

  private isDragging = false;
  private hasMoved = false;
  private startX = 0;
  private startY = 0;
  private startLeft = 0;
  private startTop = 0;
  private static readonly DRAG_THRESHOLD = 4;

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

    // Event delegation: listeners on the panel root so they survive inner DOM swaps
    // (e.g. compact ↔ detailed toggle that replaces the .cd-header child).
    panel.addEventListener('mousedown', this.onMouseDown);
    panel.addEventListener('touchstart', this.onTouchStart, { passive: false });

    // Re-clamp on resize so a saved panel never ends up off-screen.
    window.addEventListener('resize', this.onWindowResize);
  }

  ngOnDestroy(): void {
    const panel = this.el.nativeElement as HTMLElement;
    panel.removeEventListener('mousedown', this.onMouseDown);
    panel.removeEventListener('touchstart', this.onTouchStart);
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
    document.removeEventListener('touchmove', this.onTouchMove);
    document.removeEventListener('touchend', this.onTouchEnd);
    window.removeEventListener('resize', this.onWindowResize);
    window.removeEventListener('click', this.suppressNextClick, true);
  }

  /** Returns true when the event target is within the designated drag handle. */
  private isInHandle(target: HTMLElement): boolean {
    if (!this.dragHandleSelector) return true;
    return !!target.closest(this.dragHandleSelector);
  }

  private onMouseDown = (e: MouseEvent): void => {
    if (e.button !== 0) return;
    if (!this.isInHandle(e.target as HTMLElement)) return;
    if ((e.target as HTMLElement).closest('button, a, input, select, textarea')) return;
    e.preventDefault();
    this.beginDrag(e.clientX, e.clientY);
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
  };

  private onMouseMove = (e: MouseEvent): void => this.moveDrag(e.clientX, e.clientY);

  private onMouseUp = (): void => {
    this.endDrag();
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
  };

  private onTouchStart = (e: TouchEvent): void => {
    if (!this.isInHandle(e.target as HTMLElement)) return;
    if ((e.target as HTMLElement).closest('button, a, input, select, textarea')) return;
    e.preventDefault();
    const t = e.touches[0];
    this.beginDrag(t.clientX, t.clientY);
    document.addEventListener('touchmove', this.onTouchMove, { passive: false });
    document.addEventListener('touchend', this.onTouchEnd);
  };

  private onTouchMove = (e: TouchEvent): void => {
    e.preventDefault();
    const t = e.touches[0];
    this.moveDrag(t.clientX, t.clientY);
  };

  private onTouchEnd = (): void => {
    this.endDrag();
    document.removeEventListener('touchmove', this.onTouchMove);
    document.removeEventListener('touchend', this.onTouchEnd);
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

  private beginDrag(x: number, y: number): void {
    const panel = this.el.nativeElement as HTMLElement;
    const rect = panel.getBoundingClientRect();

    this.applyFixedPosition(rect.left, rect.top);

    this.isDragging = true;
    this.hasMoved = false;
    this.startX = x;
    this.startY = y;
    this.startLeft = rect.left;
    this.startTop = rect.top;

    panel.style.zIndex = String(++topZIndex);
    panel.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  }

  private moveDrag(x: number, y: number): void {
    if (!this.isDragging) return;
    if (!this.hasMoved) {
      const dx = x - this.startX;
      const dy = y - this.startY;
      if (Math.abs(dx) > DraggablePanelDirective.DRAG_THRESHOLD || Math.abs(dy) > DraggablePanelDirective.DRAG_THRESHOLD) {
        this.hasMoved = true;
      }
    }
    const { left, top } = this.clamp(
      this.startLeft + (x - this.startX),
      this.startTop + (y - this.startY),
    );
    const panel = this.el.nativeElement as HTMLElement;
    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
  }

  private endDrag(): void {
    this.isDragging = false;
    document.body.style.userSelect = '';
    const panel = this.el.nativeElement as HTMLElement;
    // Reset inline cursor/z-index so CSS class values take over again.
    panel.style.cursor = '';
    panel.style.zIndex = '';

    // Suppress the click that the browser fires after mouseup/touchend when a real drag occurred.
    if (this.hasMoved) {
      window.addEventListener('click', this.suppressNextClick, { capture: true, once: true });
    }

    // Persist the final position.
    if (this.panelId) {
      const left = parseFloat(panel.style.left) || 0;
      const top = parseFloat(panel.style.top) || 0;
      this.panelLayoutService.savePosition(this.panelId, { left, top });
    }
  }

  private suppressNextClick = (e: MouseEvent): void => {
    e.stopPropagation();
    e.preventDefault();
  };
}
