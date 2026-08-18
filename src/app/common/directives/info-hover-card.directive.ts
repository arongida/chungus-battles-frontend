import { ComponentRef, Directive, ElementRef, HostListener, Input, OnChanges, OnDestroy, SimpleChanges, ViewContainerRef } from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { InfoContent } from '../models/info-content';
import { InfoCardComponent } from '../components/info-card/info-card.component';

@Directive({
  selector: '[appInfoHoverCard]',
  standalone: true,
})
export class InfoHoverCardDirective implements OnChanges, OnDestroy {
  @Input({ alias: 'appInfoHoverCard', required: true }) content!: InfoContent;

  private overlayRef: OverlayRef | null = null;
  private cardRef: ComponentRef<InfoCardComponent> | null = null;

  // Lets a single stable hover region (one anchor, one position — see character-details for why
  // that matters over one-directive-per-cell) swap its content live while still open, e.g. a
  // sub-area within the region showing a more specific hint than the region's default. Without
  // this, `content` is only ever read once at openOverlay() time, so a later binding change (like
  // hovering a specific sub-area) would never reach an already-open card.
  ngOnChanges(changes: SimpleChanges) {
    if (changes['content'] && this.cardRef) {
      this.cardRef.setInput('content', this.content);
    }
  }

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
    this.cardRef = this.overlayRef.attach(portal);
    this.cardRef.setInput('content', this.content);
  }

  private closeOverlay() {
    this.overlayRef?.dispose();
    this.overlayRef = null;
    this.cardRef = null;
  }

  ngOnDestroy() {
    this.closeOverlay();
  }
}
