import { Component, input, Input } from '@angular/core';
import {
  Player,
} from '../../../models/colyseus-schema/PlayerSchema';
import {
  MatTooltipModule,
} from '@angular/material/tooltip';
import {
  DecimalPipe,
  NgClass,
  TitleCasePipe,
} from '@angular/common';
import {
  MatDividerModule,
} from '@angular/material/divider';
import {
  MatProgressBarModule,
} from '@angular/material/progress-bar';
import Item from '../../../models/colyseus-schema/ItemSchema';
import {
  ItemHoverCardDirective,
} from '../../directives/item-hover-card.directive';
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
    ItemHoverCardDirective,
    TitleCasePipe,
    MatTabsModule,
  ],
  templateUrl: './character-details.component.html',
  styleUrl: './character-details.component.scss',
})
export class CharacterDetailsComponent {
  @Input({ required: true }) player: Player = new Player();
  @Input() enemy: boolean = false;
  @Input() combat: boolean = false;
  @Input() showStats: boolean = true;
  playerBeingHit = input(false);
  enemyBeingHit = input(false);
  selectedCategory: string = 'inventory';
  equipSlotsOptions = Object.values(EquipSlot) as EquipSlot[];

  constructor(public draftService: DraftService) {}

  getNormalAvatarImage(): string {
    let avatar = this.player?.avatarUrl || 'assets/Portrait_ID_0_Placeholder.png';
    if (this.enemy) {
      avatar = avatar.replace('.png', '_enemy.png');
    }
    return avatar;
  }

  getCringeAvatarImage(): string {
    let avatar = this.player?.avatarUrl || 'assets/Portrait_ID_0_Placeholder.png';
    avatar = avatar.replace('.png', '_cringe.png');
    if (this.enemy) {
      avatar = avatar.replace('.png', '_enemy.png');
    }
    return avatar;
  }

  isShowingCringe(): boolean {
    return (this.enemy && this.enemyBeingHit()) || this.playerBeingHit();
  }

  getPlayerHp(): number {
    return this.player.hp > 0 && this.player.hp < 1 ? 1 : this.player.hp;
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

  getEquipmentTypeFromInventory(itemType: string) {
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
  }

  equip(item: Item, slot: EquipSlot | string) {
    this.draftService.sendMessage('equip', {
      itemId: item.itemId,
      slot: slot,
    });
  }

  unequip(item: Item | undefined, slot: EquipSlot) {
    if (!item) return;
    this.draftService.sendMessage('unequip', {
      itemId: item.itemId,
      slot: slot,
    });
  }

  getItemPriceRounded(item: Item) {
    return Math.floor(item.price * 0.7 * item.rarity);
  }

  getRarityBorder(rarity: ItemRarity | string): string {
    switch (rarity) {
      case ItemRarity.RARE:      return '2px solid #60a5fa';
      case ItemRarity.EPIC:      return '2px solid #c084fc';
      case ItemRarity.LEGENDARY: return '2px solid #fb923c';
      default:                   return '2px solid #92400e';
    }
  }

  getItemBackground(item?: Item) {
    return item ? `assets/level_${item.tier < 10 ? item.tier : item.tier - 90}_glow.png` : `assets/level_1_glow.png`;
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
        return '🗡️'
      case EquipSlot.OFF_HAND:
        return '🛡️'
      default: return '🗡️'
    }
  }

  protected readonly ItemRarity = ItemRarity;


}
