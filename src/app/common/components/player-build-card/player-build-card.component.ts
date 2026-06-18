import { Component, Input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Player } from '../../../models/colyseus-schema/PlayerSchema';
import Item from '../../../models/colyseus-schema/ItemSchema';
import { EquipSlot, ItemRarity } from '../../../models/types/ItemTypes';
import { InfoContent } from '../../models/info-content';
import { InfoHintDirective } from '../../directives/info-hint.directive';
import { ItemHoverCardDirective } from '../../directives/item-hover-card.directive';
import { SkillIconsComponent } from '../skill-icons/skill-icons.component';

/**
 * Read-only "build card": avatar + stats grid, talent icons, and equipped items for a
 * given Player. Extracted from the end-screen build panel so it can be reused wherever a
 * full character build needs to be displayed (e.g. the dev next-fight picker).
 */
@Component({
  selector: 'app-player-build-card',
  standalone: true,
  imports: [DecimalPipe, InfoHintDirective, ItemHoverCardDirective, SkillIconsComponent],
  templateUrl: './player-build-card.component.html',
  styleUrl: './player-build-card.component.scss',
})
export class PlayerBuildCardComponent {
  @Input({ required: true }) build!: Player;

  readonly equipmentLayout = [EquipSlot.HELMET, EquipSlot.MAIN_HAND, EquipSlot.OFF_HAND, EquipSlot.ARMOR];

  readonly slotIcons: Record<string, string> = {
    [EquipSlot.HELMET]:    '🪖',
    [EquipSlot.MAIN_HAND]: '⚔️',
    [EquipSlot.OFF_HAND]:  '🛡️',
    [EquipSlot.ARMOR]:     '🧥',
  };

  getEquippedItem(slot: EquipSlot): Item | null {
    return this.build?.equippedItems.get(slot) ?? null;
  }

  rarityBorderColor(item: Item | null): string {
    if (!item) return 'transparent';
    switch (item.rarity) {
      case ItemRarity.RARE: return '#60a5fa';
      case ItemRarity.EPIC: return '#c084fc';
      case ItemRarity.LEGENDARY: return '#f88528ff';
      case ItemRarity.MYTHIC: return '#d11512ff';
      default: return '#92400e';
    }
  }

  buildStatsHint(p: Player | null): InfoContent {
    if (!p) return { id: 'stats', title: 'Stats', entries: [] };
    const dodgeChance = Math.round(100 * (1 - 100 / (100 + p.dodgeRate)));
    const defenseReduction = Math.round(100 * (1 - 100 / (100 + p.defense)));
    return {
      id: 'stats',
      title: `${p.name}'s Stats`,
      entries: [
        { icon: '❤️', label: 'Health',              text: `${Math.round(p.maxHp)} HP total.`,                                                              color: 'text-pink-500' },
        { icon: '🎯', label: 'Accuracy',             text: `+${p.accuracy?.toFixed(1)} added to weapon's minimum damage roll.`,                             color: 'text-red-400' },
        { icon: '⚔️', label: 'Strength',             text: `+${p.strength?.toFixed(1)} added to weapon's maximum damage roll.`,                             color: 'text-red-400' },
        { icon: '⏩', label: 'Speed Bonus',           text: `${((p.attackSpeed - 1) * 100)?.toFixed(0)}% multiplier applied to all weapon attack speeds.`,   color: 'text-blue-400' },
        { icon: '💰', label: 'Income',               text: `${p.income} gold earned per fight. Grows by 1 automatically each fight.`,                    color: 'text-yellow-400' },
        { icon: '🧪', label: 'HP Regen',             text: `Recover ${p.hpRegen?.toFixed(3)} HP every second during battle.`,                               color: 'text-orange-400' },
        { icon: '🔰', label: 'Flat Damage Reduction',text: `Reduces all incoming damage by ${p.flatDmgReduction?.toFixed(3)} flat.`,                        color: 'text-green-400' },
        { icon: '🛡️', label: 'Defense',              text: `Reduces incoming damage by ${defenseReduction}% (DR formula, ${p.defense?.toFixed(2)} defense).`, color: 'text-green-400' },
        { icon: '🦵', label: 'Dodge',                text: `${dodgeChance}% chance to completely dodge an incoming attack.`,                                 color: 'text-green-400' },
      ],
    };
  }
}
