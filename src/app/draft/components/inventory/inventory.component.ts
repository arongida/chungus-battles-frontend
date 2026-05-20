import { Component, Inject, NgModule, OnInit } from '@angular/core';
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
import { AffectedStats } from '../../../models/colyseus-schema/AffectedStatsSchema';
import { CdkDragHandle } from "@angular/cdk/drag-drop";
import { ChangeDetectorRef } from '@angular/core';


@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatMenuModule, TitleCasePipe, DecimalPipe, NgClass, SlicePipe, UpperCasePipe, CdkDragHandle],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.scss',
})
export class InventoryComponent implements OnInit {

  itemsData: Item[];
  talentsData: TalentPreview[];
  displayedItems: Item[];
  displayedTalents: TalentPreview[];
  isItemsView: boolean;
  selectedClass: string | null = null;
  selectedTier: string | null = null;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public draftService: DraftService,
    private cdr: ChangeDetectorRef
  ) {
    this.itemsData = [];
    this.talentsData = [];
    this.displayedItems = [];
    this.displayedTalents = [];
    this.isItemsView = true;
  }

  async ngOnInit(): Promise<void> {
    const [items, talents] = await Promise.all([
      this.fetchItems(),
      this.fetchTalents()
    ]);
    this.itemsData = items;
    this.displayedItems = [...items];
    this.talentsData = talents;
    this.displayedTalents = [...talents];
    this.cdr.detectChanges();
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
        tier: e.tier.toString(),
        tags: e.tags,
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

  getItemStats(item: Item, affectedStatsObject: AffectedStats): StatLine[] {
    const s = affectedStatsObject ?? {};

    const stats: StatLine[] = [];

    if (item.baseMinDamage || item.baseMaxDamage) {
      stats.push({
        label: 'Damage',
        value: item.baseMinDamage + '-' + item.baseMaxDamage,
        icon: '⚔️',
        color: 'text-red-500'
      });
    }

    if (item.baseAttackSpeed) {
      stats.push({
        label: 'Speed',
        value: item.baseAttackSpeed.toString(),
        icon: '⏩',
        color: 'text-blue-500'
      });
    }

    if (s.defense) stats.push({ label: 'Defense', value: s.defense.toString(), icon: '🛡️', color: 'text-green-500' });
    if (s.maxHp) stats.push({ label: 'Health', value: s.maxHp.toString(), icon: '❤️', color: 'text-pink-500' });
    if (s.income) stats.push({ label: 'Income', value: s.income.toString(), icon: '💰', color: 'text-yellow-300' });
    if (s.hpRegen) stats.push({ label: 'Regen', value: s.hpRegen.toString(), icon: '🧪', color: 'text-orange-500' });

    return stats;
  }

  filterItemsByClass(type: string): void {
    this.selectedClass = type || null;
    this.applyFilters('items');
  }

  filterItemsByTier(tier: string): void {
    this.selectedTier = tier || null;
    this.applyFilters('items');
  }

  filterTalentsByClass(type: string): void {
    this.selectedClass = type || null;
    this.applyFilters('talents');
  }

    filterTalentsByTier(type: string): void {
    this.selectedTier = type || null;
    this.applyFilters('talents');
  }

  private applyFilters(mode: string): void {
    if (mode === 'items') {
      this.displayedItems = this.itemsData.filter(item => {
        const matchesClass = !this.selectedClass ||
          item.tags.map(t => t.toLowerCase()).includes(this.selectedClass.toLowerCase());
        const matchesTier = !this.selectedTier || item.tier.toString() === this.selectedTier;
        return matchesClass && matchesTier;
      });
    } else if (mode === 'talents') {
      this.displayedTalents = this.talentsData.filter(talent => {
        const matchesClass = !this.selectedClass || talent.tags.map(t => t.toLowerCase()).includes(this.selectedClass.toLowerCase());
        const matchesTier = !this.selectedTier || talent.tier === this.selectedTier;
        return matchesClass && matchesTier;
      });
    }
  }
}

export type TalentPreview = {
  name: string;
  description: string;
  tier: string;
  tags: [string];
};

type StatLine = {
  label: string;
  value: string;
  icon: string;
  color: string;
  format?: 'percent' | 'number';
};