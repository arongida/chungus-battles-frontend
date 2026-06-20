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
import Item from '../../../models/colyseus-schema/ItemSchema';
import {
  Player,
} from '../../../models/colyseus-schema/PlayerSchema';
import { ItemRarity, ItemType } from '../../../models/types/ItemTypes';

@Component({
  selector: 'app-item-card',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, TitleCasePipe, DecimalPipe, NgClass, SlicePipe, UpperCasePipe],
  templateUrl: './item-card.component.html',
  styleUrl: './item-card.component.scss',
})
export class ItemCardComponent {
  @Input({ required: true }) item: Item = new Item();
  @Input({ required: false }) player: Player = new Player();
  @Input({ required: false }) setTooltipBasedOnInventory: boolean = false;
  @Input({ required: false }) showDetails = false;
  @Input({ required: false }) showBuyButton = false;
  @Input({ required: false }) showUnequipButton = false;
  @Output() buyClicked = new EventEmitter<void>();
  @Output() unequipClicked = new EventEmitter<void>();

  protected readonly ItemRarity = ItemRarity;
  protected readonly ItemType = ItemType;

  // Display metadata per rollable stat — labels/emojis/colors match the
  // concrete-stat template block below so both render styles look the same.
  private static readonly STAT_META: Record<string, { label: string; emoji: string; colorClass: string; percent?: boolean; decimals: number }> = {
    strength:         { label: 'Strength',         emoji: '⚔️', colorClass: 'text-red-500',    decimals: 0 },
    accuracy:         { label: 'Accuracy',         emoji: '🎯', colorClass: 'text-red-500',    decimals: 0 },
    attackSpeed:      { label: 'A.speed',          emoji: '⏩', colorClass: 'text-blue-500',   percent: true, decimals: 0 },
    defense:          { label: 'Defense',          emoji: '🛡️', colorClass: 'text-green-600',  decimals: 0 },
    maxHp:            { label: 'Health',           emoji: '❤️', colorClass: 'text-pink-500',   decimals: 0 },
    flatDmgReduction: { label: 'Damage Reduction', emoji: '🔰', colorClass: 'text-green-600',  decimals: 2 },
    income:           { label: 'Income',           emoji: '💰', colorClass: 'text-yellow-300', decimals: 0 },
    dodgeRate:        { label: 'Dodge',            emoji: '🦵', colorClass: 'text-green-400',  decimals: 0 },
    hpRegen:          { label: 'Regen',            emoji: '🧪', colorClass: 'text-orange-500', decimals: 2 },
  };

  get previewRows(): { label: string; valueText: string; colorClass: string }[] {
    const rp = this.item.rollPreview;
    if (!rp) return [];
    return rp.possibleStats.map(s => {
      const m = ItemCardComponent.STAT_META[s.stat];
      if (!m) return { label: s.stat, valueText: `${s.min} - ${s.max}`, colorClass: '' };
      const fmt = (v: number) => m.percent
        ? `+${Math.round(v * 100 - 100)}%`
        : Number(v.toFixed(m.decimals)).toString();
      return {
        label: m.label,
        valueText: `${fmt(s.min)} - ${fmt(s.max)} ${m.emoji}`,
        colorClass: m.colorClass,
      };
    });
  }

  get titleColorClass(): string {
    if (this.item.rarity === ItemRarity.COMMON) return 'text-slate-300';
    const r = this.item.rarity;
    if (r === ItemRarity.RARE) return 'text-blue-500';
    if (r === ItemRarity.EPIC) return 'text-purple-500';
    if (r === ItemRarity.LEGENDARY) return 'text-orange-500';
    if (r === ItemRarity.MYTHIC) return 'text-red-500';
    return '';
  }
}
