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
import { ActiveSkillLabel, buildActiveSkillLabel } from '../../../common/utils/active-skill-label';

export type ActiveTab = 'items' | 'talents' | 'itemSkills' | 'seasons';

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
  itemSkillsData: ItemSkillPreview[] = [];
  displayedItems: Item[] = [];
  displayedTalents: TalentPreview[] = [];
  displayedItemSkills: ItemSkillPreview[] = [];
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
    const [items, talents, itemSkills, seasons] = await Promise.all([
      this.fetchItems(),
      this.fetchTalents(),
      this.fetchItemSkills(),
      this.fetchSeasons(),
    ]);
    this.itemsData = items;
    this.displayedItems = [...items];
    this.talentsData = talents;
    this.displayedTalents = [...talents];
    this.itemSkillsData = itemSkills;
    this.displayedItemSkills = [...itemSkills];
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
        activationRate: e.activationRate ?? 0,
      }));
    } catch (e) {
      console.error('Error loading talents:', e);
      return [];
    }
  }

  async fetchItemSkills(): Promise<ItemSkillPreview[]> {
    try {
      const data: any[] = await fetch(`${environment.gameServer}/itemSkills`).then(r => r.json());
      return data.map(e => ({
        name: e.name,
        class: e.class ?? '',
        descriptions: e.descriptions ?? [],
        triggerTypes: e.triggerTypes ?? [],
      }));
    } catch (e) {
      console.error('Error loading item skills:', e);
      return [];
    }
  }

  async fetchSeasons() {
    return this.seasonsService.getSeasons();
  }

  // Item skills have no per-skill artwork (they're code-defined, not DB records) — one generic
  // icon per class, reusing the same placeholder set talents fall back to.
  private static readonly SKILL_CLASS_ICONS: Record<string, string> = {
    warrior: 'assets/talents/Icon_Warrior_basic_01.png',
    rogue: 'assets/talents/Icon_Rogue_basic_01.png',
    merchant: 'assets/talents/Icon_Merchant_basic_01.png',
    shield: 'assets/items/Item_ID_76_Buckler_shield.png',
  };

  getSkillIcon(skillClass: string): string {
    return EncyclopediaComponent.SKILL_CLASS_ICONS[skillClass?.toLowerCase()] ?? '';
  }

  /** No player context in the encyclopedia (browsing the catalog, not an active run), so this
   *  always shows base cadence, never the CDR-shortened variant. Item skills have no
   *  activationRate on their catalog entry, so they fall back to a bare "Active" label. */
  activeSkillLabel(triggerTypes: string[], activationRate?: number): ActiveSkillLabel {
    return buildActiveSkillLabel(triggerTypes, activationRate);
  }

  // Matches the item card's rarity palette (item-card.component.ts's titleColorClass) so a
  // skill's rarity-tier label reads consistently wherever rarity color shows up.
  private static readonly RARITY_DESC_CLASSES: Record<number, string> = {
    1: 'enc-skill-common',
    2: 'enc-skill-rare',
    3: 'enc-skill-epic',
    4: 'enc-skill-legendary',
    5: 'enc-skill-mythic',
  };

  rarityDescClass(rarity: number): string {
    return EncyclopediaComponent.RARITY_DESC_CLASSES[rarity] ?? '';
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
    } else if (this.activeTab === 'itemSkills') {
      this.displayedItemSkills = this.itemSkillsData.filter(skill =>
        !this.selectedClass || skill.class.toLowerCase() === this.selectedClass!.toLowerCase()
      );
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
  activationRate: number;
};

export type ItemSkillDescription = {
  rarity: number;
  label: string;
  text: string;
};

export type ItemSkillPreview = {
  name: string;
  class: string;
  descriptions: ItemSkillDescription[];
  triggerTypes: string[];
};
