import { Directive, ElementRef, HostListener, Input, OnDestroy, ViewContainerRef } from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { InfoContent } from '../models/info-content';
import { InfoCardComponent } from '../components/info-card/info-card.component';

@Directive({
  selector: '[appInfoHoverCard]',
  standalone: true,
})
export class InfoHoverCardDirective implements OnDestroy {
  @Input({ alias: 'appInfoHoverCard', required: true }) content!: InfoContent;

  private overlayRef: OverlayRef | null = null;

  constructor(
    private overlay: Overlay,
    private elementRef: ElementRef,
    private viewContainerRef: ViewContainerRef,
  ) {}

  @HostListener('mouseenter')
  onMouseEnter() {
    this.openOverlay();
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    this.closeOverlay();
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
      width: '420px',
    });

    const pane = this.overlayRef.overlayElement;
    pane.style.zIndex = '1200';

    const portal = new ComponentPortal(InfoCardComponent, this.viewContainerRef);
    const ref = this.overlayRef.attach(portal);
    ref.setInput('content', this.content);
  }

  private closeOverlay() {
    this.overlayRef?.dispose();
    this.overlayRef = null;
  }

  ngOnDestroy() {
    this.closeOverlay();
  }
}
