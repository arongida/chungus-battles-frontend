import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { OverlayRef } from '@angular/cdk/overlay';
import Item from '../../../models/colyseus-schema/ItemSchema';
import { Player } from '../../../models/colyseus-schema/PlayerSchema';
import { ItemCardComponent } from '../item-card/item-card.component';

interface EquippedSlot { slot: string; item: Item; }

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
  @Input() mainCardWidth = 260;
  /** Width of each card when two are shown side by side (may differ from mainCardWidth on narrow screens). */
  @Input() comparisonCardWidth = 260;
  /** Passed from the directive so this component can resize the overlay on slot selection. */
  @Input() overlayRef: OverlayRef | null = null;
  @Output() buyClicked = new EventEmitter<void>();

  readonly selectedSlot = signal<string | null>(null);

  private static readonly ASPECT = 340 / 260;
  static readonly BUTTON_AREA_H = 60;

  get mainCardHeight(): number { return Math.round(this.mainCardWidth * ItemComparisonOverlayComponent.ASPECT); }
  get compCardHeight(): number { return Math.round(this.comparisonCardWidth * ItemComparisonOverlayComponent.ASPECT); }

  get mainGlowUrl(): string { return this.glowUrl(this.item); }

  glowUrl(item: Item): string {
    const tier = item.tier < 10 ? item.tier : item.tier - 90;
    return `url(assets/level_${tier}_glow.png)`;
  }

  get mainPadding(): string { return this.scaledPadding(this.mainCardWidth); }
  get compPadding(): string { return this.scaledPadding(this.comparisonCardWidth); }

  private scaledPadding(w: number): string {
    const s = w / 260;
    return `${Math.round(24 * s)}px ${Math.round(20 * s)}px ${Math.round(16 * s)}px`;
  }

  get equippedSlots(): EquippedSlot[] {
    const opts = this.item.equipOptions;
    if (!opts || this.item.equipped) return [];
    const result: EquippedSlot[] = [];
    for (const slot of opts) {
      const eq = this.player.equippedItems.get(slot);
      if (eq) result.push({ slot, item: eq });
    }
    return result;
  }

  get selectedEquipped(): Item | null {
    const slot = this.selectedSlot();
    if (!slot) return null;
    return this.player.equippedItems.get(slot) ?? null;
  }

  selectSlot(slot: string): void {
    this.selectedSlot.set(slot);
    if (this.overlayRef) {
      const w = this.comparisonCardWidth * 2 + 10;
      const h = this.compCardHeight + ItemComparisonOverlayComponent.BUTTON_AREA_H;
      this.overlayRef.updateSize({ width: `${w}px`, height: `${h}px` });
    }
  }

  goBack(): void {
    this.selectedSlot.set(null);
    if (this.overlayRef) {
      const w = this.mainCardWidth;
      const h = this.mainCardHeight + ItemComparisonOverlayComponent.BUTTON_AREA_H;
      this.overlayRef.updateSize({ width: `${w}px`, height: `${h}px` });
    }
  }

  formatSlot(slot: string): string {
    return slot.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();
  }
}
