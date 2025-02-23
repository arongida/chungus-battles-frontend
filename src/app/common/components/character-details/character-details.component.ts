import { Component, Input } from '@angular/core';
import {
  Player,
} from '../../../models/colyseus-schema/PlayerSchema';
import {
  MatTooltipModule,
} from '@angular/material/tooltip';
import {
  DecimalPipe,
  NgClass,
  NgStyle,
  TitleCasePipe,
} from '@angular/common';
import {
  MatDividerModule,
} from '@angular/material/divider';
import {
  MatProgressBarModule,
} from '@angular/material/progress-bar';
import {
  Item,
} from '../../../models/colyseus-schema/ItemSchema';
import { MatCardContent } from '@angular/material/card';
import {
  ItemCardComponent,
} from '../../item-card/item-card.component';
import {
  DraftService,
} from '../../../draft/services/draft.service';
import { MatButtonModule } from '@angular/material/button';
import {
  MatTabChangeEvent,
  MatTabsModule,
} from '@angular/material/tabs';
import {
  EquipSlot, ItemRarity,
} from '../../../models/types/ItemTypes';


@Component({
  selector: 'app-character-details',
  standalone: true,
  imports: [
    MatProgressBarModule,
    MatTooltipModule,
    DecimalPipe,
    MatDividerModule,
    NgClass,
    MatButtonModule,
    MatCardContent,
    ItemCardComponent,
    TitleCasePipe,
    MatTabsModule,
    NgStyle,
  ],
  templateUrl: './character-details.component.html',
  styleUrl: './character-details.component.scss',
})
export class CharacterDetailsComponent {
  @Input({ required: true }) player: Player = new Player();
  @Input() enemy: boolean = false;
  @Input() combat: boolean = false;
  selectedCategory: string = 'inventory';
  hoveredEquipment: EquipSlot | null = null;
  equipSlotsOptions = Object.values(EquipSlot) as EquipSlot[];

  constructor(public draftService: DraftService) {

  }


  getAvatarImage(): string {
    let avatar =
      this.player?.avatarUrl ||
      'https://chungus-battles.b-cdn.net/chungus-battles-assets/Portrait_ID_0_Placeholder.png';
    if (this.enemy) avatar = avatar.replace('.png', '_enemy.png');
    return avatar;
  }

  getPlayerHp(): number {
    return this.player.hp > 0 && this.player.hp < 1 ? 1 : this.player.hp;
  }

  onMouseEnterEquip(hoveredEquip: EquipSlot) {
    this.hoveredEquipment = hoveredEquip;
  }

  onMouseLeaveEquip() {
    this.hoveredEquipment = null;
  }

  onMouseEnterItem(item?: Item) {
    if (!item) return;
    if (item.showDetails) return;
    item.showDetails = true;
    item.imageCache = item.image;
    item.image = this.getItemBackground(item);
  }

  onMouseLeaveItem(item?: Item) {
    if (!item) return;
    if (!item.showDetails) return;
    item.showDetails = false;
    item.image = item.imageCache!;
  }

  getItem(type: string) {
    return this.player.inventory.find((item) => item.type === type);
  }

  selectCategory(event: MatTabChangeEvent) {
    const categoryName = event.tab.textLabel.toLocaleLowerCase().substring(0, event.tab.textLabel.length - 1);
    if (categoryName === 'al') {
      this.selectedCategory = 'inventory';
    } else {
      this.selectedCategory = categoryName;
    }
    console.log(this.selectedCategory);
  }

  onTabChange(event: MatTabChangeEvent) {
    this.selectedCategory = event.tab.textLabel.toLocaleLowerCase();
  }

  getEquipmentTypeFromInventory(itemType: string): Item[] {
    if (itemType === 'inventory') {
      return this.player.inventory;
    }
      //else if (itemType === "equipped") {
      //   return Array.from(this.player.equippedItems.values());
    // }
    else {
      return this.player.inventory.filter(item => item.type === itemType);
    }
  }

  sellSelectedItem(item: Item) {
    this.draftService.sendMessage('sell', {
      itemId: item.itemId,
    });
    this.onMouseLeaveItem(item);
  }

  equip(item: Item, slot: EquipSlot) {
    this.draftService.sendMessage('equip', {
      itemId: item.itemId,
      slot: slot,
    });
    this.onMouseLeaveItem(item);
  }

  unequip(item: Item | undefined, slot: EquipSlot) {
    if (!item) return;
    this.draftService.sendMessage('unequip', {
      itemId: item.itemId,
      slot: slot,
    });
    this.onMouseLeaveItem(item);
  }

  getItemPriceRounded(item: Item) {
    return Math.floor(item.price * 0.7);
  }

  getItemBackground(item?: Item) {
    return item ? `https://chungus-battles.b-cdn.net/chungus-battles-assets/level_${item.tier < 10 ? item.tier : item.tier - 90}_glow.png` : `https://chungus-battles.b-cdn.net/chungus-battles-assets/level_1_glow.png`;
  }

  getItemAtSlot(slot: EquipSlot) {
    return this.player.equippedItems.get(slot);
  }

  getEmojiForSlot(slot: EquipSlot) {
    switch (slot) {
      case EquipSlot.ARMOR:
        return '🧥';
      case EquipSlot.HELMET:
        return '👑'
      case EquipSlot.MAIN_HAND:
        return '🫲'
      case EquipSlot.OFF_HAND:
        return '🫱'
      default: return '🫲'
    }
  }

  protected readonly EquipSlot = EquipSlot;
  protected readonly ItemRarity = ItemRarity;
}
