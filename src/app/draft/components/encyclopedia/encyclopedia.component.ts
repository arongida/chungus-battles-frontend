import { Component, Inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import Item from '../../../models/colyseus-schema/ItemSchema';
import { MatButtonModule } from '@angular/material/button';
import { environment } from '../../../../environments/environment';
import { buildItemFromData } from '../../../common/utils/player-schema-builder';
import { Player } from '../../../models/colyseus-schema/PlayerSchema';
import { ItemCardComponent } from '../../../common/components/item-card/item-card.component';
import { ItemHoverCardDirective } from '../../../common/directives/item-hover-card.directive';
import { SeasonsService, SeasonInfo } from '../../../common/services/seasons.service';

export type ActiveTab = 'items' | 'talents' | 'seasons';

@Component({
  selector: 'app-encyclopedia',
  standalone: true,
  imports: [MatButtonModule, ItemCardComponent, ItemHoverCardDirective],
  templateUrl: './encyclopedia.component.html',
  styleUrl: './encyclopedia.component.scss',
})
export class EncyclopediaComponent implements OnInit {
  itemsData: Item[] = [];
  talentsData: TalentPreview[] = [];
  displayedItems: Item[] = [];
  displayedTalents: TalentPreview[] = [];
  seasonsData: SeasonInfo[] = [];
  currentSeason = 0;
  activeTab: ActiveTab = 'items';
  selectedClass: string | null = null;
  selectedTier: string | null = null;
  dummyPlayer: Player = new Player();

  constructor(
    @Inject(MAT_DIALOG_DATA) public dialogData: any,
    private cdr: ChangeDetectorRef,
    private seasonsService: SeasonsService,
  ) {}

  async ngOnInit(): Promise<void> {
    const [items, talents, seasons] = await Promise.all([
      this.fetchItems(),
      this.fetchTalents(),
      this.fetchSeasons(),
    ]);
    this.itemsData = items;
    this.displayedItems = [...items];
    this.talentsData = talents;
    this.displayedTalents = [...talents];
    this.seasonsData = seasons.seasons;
    this.currentSeason = seasons.currentSeason;
    this.cdr.detectChanges();
  }

  async fetchItems(): Promise<Item[]> {
    try {
      const data: any[] = await fetch(`${environment.gameServer}/items`).then(r => r.json());
      return data.map(e => buildItemFromData(e));
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
        tags: e.tags ?? [],
        image: e.image ?? '',
        triggerTypes: e.triggerTypes ?? [],
      }));
    } catch (e) {
      console.error('Error loading talents:', e);
      return [];
    }
  }

  async fetchSeasons() {
    return this.seasonsService.getSeasons();
  }

  getItemImage(item: Item): string {
    return item.image ? item.image : 'assets/Item_ID_0_Empty.png';
  }

  switchTab(tab: ActiveTab): void {
    this.activeTab = tab;
    this.applyFilters();
  }

  filterByClass(type: string): void {
    this.selectedClass = type || null;
    this.applyFilters();
  }

  filterByTier(tier: string): void {
    this.selectedTier = tier || null;
    this.applyFilters();
  }

  applyFilters(): void {
    if (this.activeTab === 'items') {
      this.displayedItems = this.itemsData.filter(item => {
        const matchesClass = !this.selectedClass ||
          item.tags.map((t: string) => t.toLowerCase()).includes(this.selectedClass!.toLowerCase());
        const matchesTier = !this.selectedTier || item.tier.toString() === this.selectedTier;
        return matchesClass && matchesTier;
      });
    } else if (this.activeTab === 'talents') {
      this.displayedTalents = this.talentsData.filter(talent => {
        const matchesClass = !this.selectedClass ||
          talent.tags.map(t => t.toLowerCase()).includes(this.selectedClass!.toLowerCase());
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
  tags: string[];
  image: string;
  triggerTypes: string[];
};
