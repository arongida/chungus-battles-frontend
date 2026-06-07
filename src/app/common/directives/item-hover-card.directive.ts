import {
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  PLATFORM_ID,
  SimpleChanges,
  ViewContainerRef,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { ItemCardComponent } from '../components/item-card/item-card.component';
import Item from '../../models/colyseus-schema/ItemSchema';
import { Player } from '../../models/colyseus-schema/PlayerSchema';

@Directive({
  selector: '[appItemHoverCard]',
  standalone: true,
})
export class ItemHoverCardDirective implements OnChanges, OnDestroy {
  @Input({ alias: 'appItemHoverCard', required: true }) item!: Item;
  @Input({ required: true }) hoverPlayer!: Player;
  @Input({ required: false }) hoverCardDisabled = false;
  @Input({ required: false }) showGlow = false;
  @Input({ required: false }) touchOnly = false;
  @Input({ required: false }) showBuyInOverlay = true;
  @Output() buyFromPopup = new EventEmitter<void>();

  private overlayRef: OverlayRef | null = null;
  private originalImage: string | null = null;
  private readonly isTouch: boolean;

  private get touchMode(): boolean {
    return this.isTouch || this.touchOnly;
  }

  constructor(
    private overlay: Overlay,
    private elementRef: ElementRef,
    private viewContainerRef: ViewContainerRef,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {
    this.isTouch = isPlatformBrowser(this.platformId) && window.matchMedia('(hover: none)').matches;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['hoverCardDisabled']?.currentValue === true) {
      if (this.showGlow) this.restoreImage();
      this.closeOverlay();
    }
  }

  @HostListener('mouseenter')
  onMouseEnter() {
    if (this.touchMode || this.hoverCardDisabled) return;
    if (this.showGlow) this.applyGlow();
    this.openOverlay();
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    if (this.touchMode) return;
    if (this.showGlow) this.restoreImage();
    this.closeOverlay();
  }

  @HostListener('click')
  onClick() {
    if (!this.touchMode || this.hoverCardDisabled) return;
    if (this.overlayRef?.hasAttached()) {
      if (this.showGlow) this.restoreImage();
      this.closeOverlay();
    } else {
      if (this.showGlow) this.applyGlow();
      this.openTouchOverlay();
    }
  }

  private openTouchOverlay() {
    if (this.overlayRef?.hasAttached()) return;

    const tier = this.item.tier < 10 ? this.item.tier : this.item.tier - 90;

    this.overlayRef = this.overlay.create({
      positionStrategy: this.overlay.position().global().centerHorizontally().centerVertically(),
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      width: '260px',
      height: '340px',
    });

    this.overlayRef.backdropClick().subscribe(() => {
      if (this.showGlow) this.restoreImage();
      this.closeOverlay();
    });

    const pane = this.overlayRef.overlayElement;
    this.applyPaneStyles(pane, tier);

    const portal = new ComponentPortal(ItemCardComponent, this.viewContainerRef);
    const componentRef = this.overlayRef.attach(portal);
    componentRef.setInput('item', this.item);
    componentRef.setInput('player', this.hoverPlayer);
    componentRef.setInput('showDetails', true);
    componentRef.setInput('showBuyButton', this.showBuyInOverlay);
    const buySub = componentRef.instance.buyClicked.subscribe(() => {
      this.buyFromPopup.emit();
      this.closeOverlay();
    });
    this.overlayRef.detachments().subscribe(() => buySub.unsubscribe());
  }

  private openOverlay() {
    if (this.overlayRef?.hasAttached()) return;

    const tier = this.item.tier < 10 ? this.item.tier : this.item.tier - 90;

    this.overlayRef = this.overlay.create({
      positionStrategy: this.overlay
        .position()
        .flexibleConnectedTo(this.elementRef)
        .withFlexibleDimensions(false)
        .withPositions([
          { originX: 'end', originY: 'center', overlayX: 'start', overlayY: 'center', offsetX: 8 },
          { originX: 'start', originY: 'center', overlayX: 'end', overlayY: 'center', offsetX: -8 },
          { originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top', offsetY: 8 },
        ]),
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      width: '210px',
      height: '280px',
    });

    const pane = this.overlayRef.overlayElement;
    this.applyPaneStyles(pane, tier);

    const portal = new ComponentPortal(ItemCardComponent, this.viewContainerRef);
    const componentRef = this.overlayRef.attach(portal);
    componentRef.setInput('item', this.item);
    componentRef.setInput('player', this.hoverPlayer);
    componentRef.setInput('showDetails', true);
  }

  private applyPaneStyles(pane: HTMLElement, tier: number) {
    pane.style.backgroundImage = `url(assets/level_${tier}_glow.png)`;
    pane.style.backgroundSize = 'cover';
    pane.style.backgroundPosition = 'center';
    pane.style.borderRadius = '8px';
    pane.style.overflow = 'hidden';
    pane.style.boxShadow = '0 4px 24px rgba(0,0,0,0.7)';
    pane.style.zIndex = '1000';
  }

  private applyGlow() {
    if (!this.item.image || this.originalImage) return;
    const tier = this.item.tier < 10 ? this.item.tier : this.item.tier - 90;
    this.originalImage = this.item.image;
    this.item.image = `assets/level_${tier}_glow.png`;
  }

  private restoreImage() {
    if (this.originalImage) {
      this.item.image = this.originalImage;
      this.originalImage = null;
    }
  }

  private closeOverlay() {
    this.overlayRef?.dispose();
    this.overlayRef = null;
  }

  ngOnDestroy() {
    this.restoreImage();
    this.closeOverlay();
  }
}
