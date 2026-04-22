import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import {
  DecimalPipe,
  NgClass,
  SlicePipe,
  TitleCasePipe,
  UpperCasePipe,
} from '@angular/common';
import Item from '../../models/colyseus-schema/ItemSchema';
import {
  Player,
} from '../../models/colyseus-schema/PlayerSchema';
import { ItemRarity } from '../../models/types/ItemTypes';

@Component({
  selector: 'app-item-card',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, TitleCasePipe, DecimalPipe, NgClass, SlicePipe, UpperCasePipe],
  templateUrl: './item-card.component.html',
  styleUrl: './item-card.component.scss',
})
export class ItemCardComponent {
  @Input({ required: true }) item: Item = new Item();
  @Input({ required: true }) player: Player = new Player();
  @Input({ required: false }) setTooltipBasedOnInventory: boolean = false;
  @Input({ required: false }) showDetails = false;
  @Input({ required: false }) showBuyButton = false;
  @Output() buyClicked = new EventEmitter<void>();

  protected readonly ItemRarity = ItemRarity;

  get upgradeRarity(): ItemRarity | 0 {
    if (!this.showBuyButton) return 0;
    if (this.item.sold) return 0;
    const count = this.player.getOwnedCountForItem(this.item);
    if (count === 0) return 0;
    if (count === 7) return ItemRarity.LEGENDARY;
    if (count === 3) return ItemRarity.EPIC;
    if (count === 2 || count === 4 || count === 6) return ItemRarity.COMMON;
    if (count >= 1) return ItemRarity.RARE;
    return 0;
  }

  get titleColorClass(): string {
    if (this.upgradeRarity === ItemRarity.COMMON) return 'text-slate-300';
    const r = this.upgradeRarity || this.item.rarity;
    if (r === ItemRarity.RARE) return 'text-blue-500';
    if (r === ItemRarity.EPIC) return 'text-purple-500';
    if (r === ItemRarity.LEGENDARY) return 'text-orange-500';
    return '';
  }
}
