import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import Item from '../../../models/colyseus-schema/ItemSchema';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { DraftService } from '../../services/draft.service';
import { environment } from '../../../../environments/environment';
import { buildItemFromData } from '../../../common/utils/player-schema-builder';
import {
  DecimalPipe,
  NgClass,
  SlicePipe,
  TitleCasePipe,
  UpperCasePipe,
} from '@angular/common';


@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatMenuModule,TitleCasePipe, DecimalPipe, NgClass, SlicePipe, UpperCasePipe],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.scss',
})
export class InventoryComponent implements OnInit {

  displayedItems: Item[];
  dispalyedTalents: TalentPreview[];
  isItemsView: boolean;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public draftService: DraftService
  ) {

    this.displayedItems = [];
    this.dispalyedTalents = [];
    this.isItemsView = true;
  }

  async ngOnInit(): Promise<void> {
    this.displayedItems = await this.fetchItems();
    this.dispalyedTalents = await this.fetchTalents();
  }

  async fetchItems(): Promise<Item[]> {
    try {
      const data: any[] = await fetch(`${environment.gameServer}/items`).then(r => r.json());
      const itemsArray = data.map((e) => buildItemFromData(e))
      return itemsArray;

    } catch (e) {
      console.error('Error loading items:', e);
      return [];
    }

  }

  async fetchTalents(): Promise<TalentPreview[]> {
    try {
      const data: any[] = await fetch(`${environment.gameServer}/talents`).then(r => r.json());
      return data.map(e => ({
        name: e.name,
        description: e.description,
      }));
    } catch (e) {
      console.error('Error loading items:', e);
      return [];
    }
  }

  getItemImage(item: Item) {
    return item.image ? item.image : 'assets/Item_ID_0_Empty.png';
  }

  getTalentImage() {
    return 'assets/talent_tablet_01_horizontal.png';
  }

  onMouseEnterItem(item: Item) {
    item.showDetails = true;
    item.imageCache = item.image;
    item.image = `assets/level_${item.tier}_glow.png`;
  }

  onMouseLeaveItem(item: Item) {
    item.showDetails = false;
    item.image = item.imageCache ? item.imageCache : item.image;
  }

  getItemStats(item: Item): StatLine[] {
    const s = item.affectedStats ?? {};
    const e = item.setBonusStats ?? {};

    const fmtPercent = (v: number) => `${v > 0 ? '+' : ''}${Math.round((v - 1) * 100)}%`;

    const stats: StatLine[] = [];

    if (item.baseMinDamage || item.baseMaxDamage) {
      stats.push({
        label: 'Damage',
        value: item.baseMinDamage,
        icon: '⚔️',
        color: 'text-red-500'
      });
    }

    if (item.baseAttackSpeed) {
      stats.push({
        label: 'Speed',
        value: item.baseAttackSpeed,
        icon: '⏩',
        color: 'text-blue-500'
      });
    }

    if (s.strength) stats.push({ label: 'Strength', value: s.strength, icon: '⚔️', color: 'text-red-500' });
    if (s.accuracy) stats.push({ label: 'Accuracy', value: s.accuracy, icon: '🎯', color: 'text-red-500' });
    if (s.defense) stats.push({ label: 'Defense', value: s.defense, icon: '🛡️', color: 'text-green-500' });
    if (s.maxHp) stats.push({ label: 'Health', value: s.maxHp, icon: '❤️', color: 'text-pink-500' });
    if (s.income) stats.push({ label: 'Income', value: s.income, icon: '💰', color: 'text-yellow-300' });
    if (s.hpRegen) stats.push({ label: 'Regen', value: s.hpRegen, icon: '🧪', color: 'text-orange-500' });

    return stats;
  }
}

export type TalentPreview = {
  name: string;
  description: string;
};

type StatLine = {
  label: string;
  value: number;
  icon: string;
  color: string;
  format?: 'percent' | 'number';
};