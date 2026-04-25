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
import { InfoHintDirective } from '../../directives/info-hint.directive';
import { InfoContent } from '../../models/info-content';


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
    InfoHintDirective,
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

  readonly equipHint: InfoContent = {
    title: 'Equip Item',
    entries: [
      { icon: '🗡️', label: 'Equip', text: 'Place this item into an equipment slot. Equipped items provide their stats during battle.' },
      { icon: '🔗', label: 'Set Bonus', text: 'Equipping two items from the same set activates a powerful set bonus.' },
      { icon: '↩️', label: 'Unequip', text: 'Click an equipped item in the slots above to unequip and return it to your inventory.' },
    ],
  };

  readonly sellHint: InfoContent = {
    title: 'Sell Item',
    entries: [
      { icon: '🟡', label: 'Sell for Gold', text: 'Sell this item for 70% of its base price. Sold items cannot be recovered.' },
    ],
  };

  get allStatsHint(): InfoContent {
    const dodgeChance = Math.round(100 * (1 - 100 / (100 + this.player.dodgeRate)));
    const defenseReduction = Math.round(100 * (1 - 100 / (100 + this.player.defense)));
    return {
      title: 'Your Stats',
      entries: [
        { icon: '❤️', label: 'Health', text: `${Math.round(this.player.maxHp)} HP total. Reaches zero = you lose the battle.`, color: 'text-pink-500' },
        { icon: '🎯', label: 'Accuracy', text: `+${this.player.accuracy.toFixed(1)} added to your weapon's minimum damage roll.`, color: 'text-red-400' },
        { icon: '⚔️', label: 'Strength', text: `+${this.player.strength.toFixed(1)} added to your weapon's maximum damage roll.`, color: 'text-red-400' },
        { icon: '⏩', label: 'Speed Bonus', text: `${((this.player.attackSpeed - 1) * 100).toFixed(0)}% multiplier applied to all weapon attack speeds.`, color: 'text-blue-400' },
        { icon: '💰', label: 'Income', text: `+${this.player.income} bonus gold earned at the end of each fight.`, color: 'text-yellow-400' },
        { icon: '🧪', label: 'HP Regen', text: `Recover ${this.player.hpRegen.toFixed(3)} HP every second during battle.`, color: 'text-orange-400' },
        { icon: '🔰', label: 'Flat Damage Reduction', text: `Reduces all incoming damage by ${this.player.flatDmgReduction.toFixed(3)} flat.`, color: 'text-green-400' },
        { icon: '🛡️', label: 'Defense', text: `Reduces incoming damage by ${defenseReduction}% (DR formula applied to ${this.player.defense.toFixed(2)} defense).`, color: 'text-green-400' },
        { icon: '🦵', label: 'Dodge', text: `${dodgeChance}% chance to completely dodge an incoming attack.`, color: 'text-green-400' },
      ],
    };
  }
}
