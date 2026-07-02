import {
  ComponentRef,
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
import { ItemComparisonOverlayComponent } from '../components/item-comparison-overlay/item-comparison-overlay.component';
import Item from '../../models/colyseus-schema/ItemSchema';
import { Player } from '../../models/colyseus-schema/PlayerSchema';
import { InfoBoxService } from '../services/info-box.service';
import { InfoContent } from '../models/info-content';

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
  @Input({ required: false }) showUnequipInOverlay = false;
  /** Forwarded to the popped-out ItemCardComponent's `isFreeLuckyFind` input (see
   *  ItemCardComponent — Black Market Contact's once-per-draft-phase free buy). */
  @Input({ required: false }) isFreeLuckyFind = false;
  /** Optional hint to gate the touch overlay behind — first tap shows the hint once, later taps open the overlay. */
  @Input() hintContent?: InfoContent;
  /** When true, the popped-out ItemCardComponent shows a "vs equipped" stat comparison. */
  @Input() showComparison = false;
  @Output() buyFromPopup = new EventEmitter<void>();
  @Output() unequipFromPopup = new EventEmitter<void>();

  private overlayRef: OverlayRef | null = null;
  private originalImage: string | null = null;
  private readonly isTouch: boolean;
  // The overlay pane sits outside this element in the DOM, so a mouseleave fired by moving
  // onto it would normally close the card before you could scroll it. Instead we keep the
  // mouse over the trigger and redirect its wheel events into the card's own scroll area.
  private activeScrollEl: Element | null = null;

  private get touchMode(): boolean {
    return this.isTouch || this.touchOnly;
  }

  constructor(
    private overlay: Overlay,
    private elementRef: ElementRef,
    private viewContainerRef: ViewContainerRef,
    private infoBoxService: InfoBoxService,
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

  @HostListener('wheel', ['$event'])
  onWheel(event: WheelEvent) {
    if (!this.activeScrollEl) return;
    event.preventDefault();
    this.activeScrollEl.scrollTop += event.deltaY;
  }

  @HostListener('click')
  onClick() {
    if (!this.touchMode || this.hoverCardDisabled) return;
    if (this.overlayRef?.hasAttached()) {
      if (this.showGlow) this.restoreImage();
      this.closeOverlay();
    } else if (this.hintContent) {
      this.infoBoxService.runGated(this.hintContent, () => {
        if (this.showGlow) this.applyGlow();
        this.openTouchOverlay();
      });
    } else {
      if (this.showGlow) this.applyGlow();
      this.openTouchOverlay();
    }
  }

  private openTouchOverlay() {
    if (this.overlayRef?.hasAttached()) return;

    const tier = this.item.tier < 10 ? this.item.tier : this.item.tier - 90;
    const hasEquipped = this.showComparison && this.hasAnyEquippedInSlots();

    if (hasEquipped) {
      this.openComparisonOverlay();
    } else {
      this.openSingleCardOverlay(tier);
    }
  }

  /**
   * Comparison overlay — starts at single-card size showing the shop item + slot buttons.
   * The ItemComparisonOverlayComponent resizes the CDK overlay when the user picks a slot.
   */
  private openComparisonOverlay(): void {
    const vw = window.innerWidth;
    // Single-card initial display: same size as the no-comparison overlay.
    const mainW = Math.min(260, Math.floor(vw * 0.9));
    const mainH = Math.round(mainW * 340 / 260);
    // Comparison mode: fit two cards in 96vw with a 10px gap (narrower than mainW on small screens).
    const compW = Math.min(mainW, Math.floor((Math.min(vw * 0.96, 530) - 10) / 2));
    const { BUTTON_AREA_H } = ItemComparisonOverlayComponent;
    const singlePaneH = mainH + BUTTON_AREA_H;

    this.overlayRef = this.overlay.create({
      positionStrategy: this.overlay.position().global().centerHorizontally().centerVertically(),
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      width: `${mainW}px`,
      height: `${singlePaneH}px`,
    });

    this.overlayRef.backdropClick().subscribe(() => {
      if (this.showGlow) this.restoreImage();
      this.closeOverlay();
    });

    const portal = new ComponentPortal(ItemComparisonOverlayComponent, this.viewContainerRef);
    const componentRef = this.overlayRef.attach(portal);
    componentRef.setInput('item', this.item);
    componentRef.setInput('player', this.hoverPlayer);
    componentRef.setInput('isFreeLuckyFind', this.isFreeLuckyFind);
    componentRef.setInput('mainCardWidth', mainW);
    componentRef.setInput('comparisonCardWidth', compW);
    componentRef.setInput('overlayRef', this.overlayRef);
    componentRef.setInput('showCardNames', vw >= 640);
    componentRef.changeDetectorRef.detectChanges();
    this.activeScrollEl = componentRef.location.nativeElement.querySelector('.item-card-details-scroll');

    const buySub = componentRef.instance.buyClicked.subscribe(() => {
      this.buyFromPopup.emit();
      this.closeOverlay();
    });
    this.overlayRef.detachments().subscribe(() => buySub.unsubscribe());
  }

  /** Original single-card touch overlay. */
  private openSingleCardOverlay(tier: number): void {
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
    componentRef.setInput('showPrice', false);
    componentRef.setInput('showBuyButton', this.showBuyInOverlay);
    componentRef.setInput('showUnequipButton', this.showUnequipInOverlay);
    componentRef.setInput('isFreeLuckyFind', this.isFreeLuckyFind);
    this.captureScrollEl(componentRef);
    const buySub = componentRef.instance.buyClicked.subscribe(() => {
      this.buyFromPopup.emit();
      this.closeOverlay();
    });
    const unequipSub = componentRef.instance.unequipClicked.subscribe(() => {
      this.unequipFromPopup.emit();
      this.closeOverlay();
    });
    this.overlayRef.detachments().subscribe(() => {
      buySub.unsubscribe();
      unequipSub.unsubscribe();
    });
  }

  /** True when at least one of the item's possible equip slots already has an item equipped. */
  private hasAnyEquippedInSlots(): boolean {
    if (this.item.equipped || !this.item.equipOptions) return false;
    for (const slot of this.item.equipOptions) {
      if (this.hoverPlayer.equippedItems.get(slot)) return true;
    }
    return false;
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
      width: '240px',
      height: '320px',
    });

    const pane = this.overlayRef.overlayElement;
    this.applyPaneStyles(pane, tier);

    const portal = new ComponentPortal(ItemCardComponent, this.viewContainerRef);
    const componentRef = this.overlayRef.attach(portal);
    componentRef.setInput('item', this.item);
    componentRef.setInput('player', this.hoverPlayer);
    componentRef.setInput('showDetails', true);
    componentRef.setInput('showPrice', false);
    this.captureScrollEl(componentRef);
  }

  /** Forces the just-attached card to render, then grabs its internal scroll container
   *  so wheel events on the (still-hovered) trigger element can be redirected into it. */
  private captureScrollEl(componentRef: ComponentRef<ItemCardComponent>): void {
    componentRef.changeDetectorRef.detectChanges();
    this.activeScrollEl = componentRef.location.nativeElement.querySelector('.item-card-details-scroll');
  }

  private applyPaneStyles(pane: HTMLElement, tier: number) {
    pane.style.backgroundImage = `url(assets/level_${tier}_glow.png)`;
    pane.style.backgroundSize = 'cover';
    pane.style.backgroundPosition = 'center';
    pane.style.borderRadius = '8px';
    pane.style.overflow = 'hidden';
    pane.style.boxShadow = '0 4px 24px rgba(0,0,0,0.7)';
    pane.style.zIndex = '1000';
    // Keep text clear of the frame artwork's painted border (the glow background is a
    // decorative ornate frame, not a plain backdrop) — box-sizing keeps the pane's overall
    // footprint unchanged, just shrinking the inner content area.
    pane.style.boxSizing = 'border-box';
    pane.style.padding = '24px 20px 16px';
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
    this.activeScrollEl = null;
  }

  ngOnDestroy() {
    this.restoreImage();
    this.closeOverlay();
  }
}
