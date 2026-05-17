import { Directive, ElementRef, HostListener, Input, OnDestroy, ViewContainerRef } from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { CombatLogEntry } from '../../models/types/CombatLogEntry';
import { CombatLogCardComponent } from '../components/combat-log-card/combat-log-card.component';
import { Player } from '../../models/colyseus-schema/PlayerSchema';

const NARRATION_KINDS = new Set(['countdown', 'fight_start', 'fight_end']);

@Directive({
  selector: '[appCombatLogHoverCard]',
  standalone: true,
})
export class CombatLogHoverCardDirective implements OnDestroy {
  @Input({ alias: 'appCombatLogHoverCard', required: true }) entry!: CombatLogEntry;
  @Input({ required: true }) hoverPlayer!: Player;
  @Input({ required: true }) hoverEnemy!: Player;

  private overlayRef: OverlayRef | null = null;
  private closeTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private overlay: Overlay,
    private elementRef: ElementRef,
    private viewContainerRef: ViewContainerRef,
  ) {}

  @HostListener('mouseenter')
  onMouseEnter() {
    this.cancelClose();
    this.openOverlay();
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    this.scheduleClose();
  }

  private openOverlay() {
    if (!this.entry?.kind || NARRATION_KINDS.has(this.entry.kind)) return;
    if (this.overlayRef?.hasAttached()) return;

    this.overlayRef = this.overlay.create({
      positionStrategy: this.overlay
        .position()
        .flexibleConnectedTo(this.elementRef)
        .withFlexibleDimensions(false)
        .withPositions([
          { originX: 'end',    originY: 'center', overlayX: 'start',  overlayY: 'center', offsetX: 8  },
          { originX: 'start',  originY: 'center', overlayX: 'end',    overlayY: 'center', offsetX: -8 },
          { originX: 'center', originY: 'top',    overlayX: 'center', overlayY: 'bottom', offsetY: -8 },
          { originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top',    offsetY: 8  },
        ]),
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      width: '210px',
    });

    const pane = this.overlayRef.overlayElement;
    pane.style.zIndex = '1200';

    const portal = new ComponentPortal(CombatLogCardComponent, this.viewContainerRef);
    const ref = this.overlayRef.attach(portal);
    ref.setInput('entry', this.entry);
    ref.setInput('player', this.hoverPlayer);
    ref.setInput('enemy', this.hoverEnemy);

    pane.addEventListener('mouseenter', () => this.cancelClose());
    pane.addEventListener('mouseleave', () => this.scheduleClose());
  }

  private scheduleClose() {
    this.closeTimeout = setTimeout(() => this.closeOverlay(), 100);
  }

  private cancelClose() {
    if (this.closeTimeout !== null) {
      clearTimeout(this.closeTimeout);
      this.closeTimeout = null;
    }
  }

  private closeOverlay() {
    this.overlayRef?.dispose();
    this.overlayRef = null;
  }

  ngOnDestroy() {
    this.cancelClose();
    this.closeOverlay();
  }
}
