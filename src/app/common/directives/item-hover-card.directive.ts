import {
  Directive,
  ElementRef,
  HostListener,
  Input,
  OnDestroy,
  ViewContainerRef,
} from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { ItemCardComponent } from '../item-card/item-card.component';
import Item from '../../models/colyseus-schema/ItemSchema';
import { Player } from '../../models/colyseus-schema/PlayerSchema';

@Directive({
  selector: '[appItemHoverCard]',
  standalone: true,
})
export class ItemHoverCardDirective implements OnDestroy {
  @Input({ alias: 'appItemHoverCard', required: true }) item!: Item;
  @Input({ required: true }) hoverPlayer!: Player;
  @Input({ required: false }) hoverCardDisabled = false;
  @Input({ required: false }) showGlow = false;

  private overlayRef: OverlayRef | null = null;
  private closeTimeout: ReturnType<typeof setTimeout> | null = null;
  private originalImage: string | null = null;

  constructor(
    private overlay: Overlay,
    private elementRef: ElementRef,
    private viewContainerRef: ViewContainerRef,
  ) {}

  @HostListener('mouseenter')
  onMouseEnter() {
    if (this.hoverCardDisabled) return;
    this.cancelClose();
    if (this.showGlow) this.applyGlow();
    this.openOverlay();
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    if (this.showGlow) this.restoreImage();
    this.scheduleClose();
  }

  private openOverlay() {
    if (this.overlayRef?.hasAttached()) return;

    const tier = this.item.tier < 10 ? this.item.tier : this.item.tier - 90;

    this.overlayRef = this.overlay.create({
      positionStrategy: this.overlay
        .position()
        .flexibleConnectedTo(this.elementRef)
        .withPositions([
          { originX: 'end', originY: 'center', overlayX: 'start', overlayY: 'center', offsetX: 8 },
          { originX: 'start', originY: 'center', overlayX: 'end', overlayY: 'center', offsetX: -8 },
          { originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top', offsetY: 8 },
        ]),
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
    });

    const pane = this.overlayRef.overlayElement;
    pane.style.width = '240px';
    pane.style.minHeight = '280px';
    pane.style.backgroundImage = `url(assets/level_${tier}_glow.png)`;
    pane.style.backgroundSize = 'cover';
    pane.style.backgroundPosition = 'center';
    pane.style.borderRadius = '8px';
    pane.style.overflow = 'hidden';
    pane.style.boxShadow = '0 4px 24px rgba(0,0,0,0.7)';
    pane.style.zIndex = '1000';

    const portal = new ComponentPortal(ItemCardComponent, this.viewContainerRef);
    const componentRef = this.overlayRef.attach(portal);
    componentRef.setInput('item', this.item);
    componentRef.setInput('player', this.hoverPlayer);
    componentRef.setInput('showDetails', true);

    pane.addEventListener('mouseenter', () => this.cancelClose());
    pane.addEventListener('mouseleave', () => this.scheduleClose());
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
    this.restoreImage();
    this.closeOverlay();
  }
}
