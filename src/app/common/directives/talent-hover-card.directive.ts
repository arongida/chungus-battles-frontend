import { Directive, ElementRef, HostListener, Input, OnDestroy, ViewContainerRef } from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Talent } from '../../models/colyseus-schema/TalentSchema';
import { TalentCardComponent } from '../components/talent-card/talent-card.component';

@Directive({
  selector: '[appTalentHoverCard]',
  standalone: true,
})
export class TalentHoverCardDirective implements OnDestroy {
  @Input({ alias: 'appTalentHoverCard', required: true }) talent!: Talent;

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
    if (this.overlayRef?.hasAttached()) return;

    this.overlayRef = this.overlay.create({
      positionStrategy: this.overlay
        .position()
        .flexibleConnectedTo(this.elementRef)
        .withFlexibleDimensions(false)
        .withPositions([
          { originX: 'end',    originY: 'center', overlayX: 'start',  overlayY: 'center', offsetX: 8  },
          { originX: 'start',  originY: 'center', overlayX: 'end',    overlayY: 'center', offsetX: -8 },
          { originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top',    offsetY: 8  },
          { originX: 'center', originY: 'top',    overlayX: 'center', overlayY: 'bottom', offsetY: -8 },
        ]),
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      width: '220px',
    });

    const pane = this.overlayRef.overlayElement;
    pane.style.background = 'rgba(10, 10, 15, 0.97)';
    pane.style.border = '1px solid rgba(180, 120, 30, 0.5)';
    pane.style.borderRadius = '6px';
    pane.style.overflow = 'hidden';
    pane.style.boxShadow = '0 0 20px rgba(180, 120, 30, 0.15), 0 4px 24px rgba(0, 0, 0, 0.8)';
    pane.style.zIndex = '1200';

    const portal = new ComponentPortal(TalentCardComponent, this.viewContainerRef);
    const ref = this.overlayRef.attach(portal);
    ref.setInput('talent', this.talent);

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
