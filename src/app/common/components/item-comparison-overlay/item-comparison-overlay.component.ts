import { Component, EventEmitter, Input, Output } from '@angular/core';
import Item from '../../../models/colyseus-schema/ItemSchema';
import { Player } from '../../../models/colyseus-schema/PlayerSchema';
import { ItemCardComponent } from '../item-card/item-card.component';

@Component({
  selector: 'app-item-comparison-overlay',
  standalone: true,
  imports: [ItemCardComponent],
  templateUrl: './item-comparison-overlay.component.html',
  styleUrl: './item-comparison-overlay.component.scss',
})
export class ItemComparisonOverlayComponent {
  @Input({ required: true }) item!: Item;
  @Input({ required: true }) player!: Player;
  @Input() isFreeLuckyFind = false;
  /** Pixel width of the main (shop) card frame. Height is derived from aspect ratio. */
  @Input() mainCardWidth = 260;
  /** Pixel width of the equipped card frame. Height is derived from aspect ratio. */
  @Input() equippedCardWidth = 195;
  @Output() buyClicked = new EventEmitter<void>();

  private static readonly CARD_ASPECT = 340 / 260;

  get mainCardHeight(): number { return Math.round(this.mainCardWidth * ItemComparisonOverlayComponent.CARD_ASPECT); }
  get equippedCardHeight(): number { return Math.round(this.equippedCardWidth * ItemComparisonOverlayComponent.CARD_ASPECT); }

  get mainGlowUrl(): string {
    const tier = this.item.tier < 10 ? this.item.tier : this.item.tier - 90;
    return `url(assets/level_${tier}_glow.png)`;
  }

  get equippedGlowUrl(): string {
    const eq = this.equippedItem;
    if (!eq) return '';
    const tier = eq.tier < 10 ? eq.tier : eq.tier - 90;
    return `url(assets/level_${tier}_glow.png)`;
  }

  /** Padding scaled proportionally to the card width (original frame is 260px with 24/20/16 padding). */
  get mainPadding(): string { return this.scaledPadding(this.mainCardWidth); }
  get equippedPadding(): string { return this.scaledPadding(this.equippedCardWidth); }

  private scaledPadding(w: number): string {
    const s = w / 260;
    return `${Math.round(24 * s)}px ${Math.round(20 * s)}px ${Math.round(16 * s)}px`;
  }

  get equippedItem(): Item | undefined {
    const opts = this.item.equipOptions;
    if (!opts) return undefined;
    for (const slot of opts) {
      const equipped = this.player.equippedItems.get(slot);
      if (equipped) return equipped;
    }
    return undefined;
  }
}
