import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Player } from '../models/colyseus-schema/PlayerSchema';
import Item from '../models/colyseus-schema/ItemSchema';
import { AffectedStats } from '../models/colyseus-schema/AffectedStatsSchema';
import { environment } from '../../environments/environment';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ArraySchema, MapSchema } from '@colyseus/schema';
import { Talent } from '../models/colyseus-schema/TalentSchema';
import { InfoBoxService } from '../common/services/info-box.service';
import { EquipSlot, ItemRarity } from '../models/types/ItemTypes';
import { ItemHoverCardDirective } from '../common/directives/item-hover-card.directive';
import { SkillIconsComponent } from '../common/components/skill-icons/skill-icons.component';

@Component({
  selector: 'app-end',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, ItemHoverCardDirective, SkillIconsComponent],
  templateUrl: './end.component.html',
  styleUrl: './end.component.scss',
})
export class EndComponent implements OnInit, OnDestroy {
  message: string = 'Game Over';
  topPlayers = signal<Player[]>([]);
  topPlayersLatestVersion = signal<Player[]>([]);
  activeTab = signal<'all-time' | 'latest-version'>('latest-version');
  playerId: number = 0;
  playerRank = signal<number>(0);
  playerName = signal<string>('');
  playerWins = signal<number>(0);

  hoveredPlayerId = signal<number | null>(null);
  pinnedPlayerId = signal<number | null>(null);
  panelBuild = signal<Player | null>(null);
  panelLoading = signal(false);
  panelHovered = signal(false);

  readonly equipmentLayout = [
    [EquipSlot.HELMET],
    [EquipSlot.MAIN_HAND, EquipSlot.OFF_HAND],
    [EquipSlot.ARMOR],
  ];

  private buildCache = new Map<number, Player>();
  private intervalId: any;
  private leaveTimeout: any;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private infoBoxService: InfoBoxService,
  ) {}

  get infoBoxVisible() {
    return this.infoBoxService.isVisible;
  }

  toggleInfoBox() {
    this.infoBoxService.toggle();
  }

  isPanelVisible(): boolean {
    return this.panelBuild() !== null &&
      (this.pinnedPlayerId() !== null || this.hoveredPlayerId() !== null || this.panelHovered());
  }

  isPinned(playerId: number): boolean {
    return this.pinnedPlayerId() === playerId;
  }

  isActive(playerId: number): boolean {
    return this.pinnedPlayerId() === playerId || this.hoveredPlayerId() === playerId;
  }

  getEquippedItem(slot: EquipSlot): Item | null {
    return this.panelBuild()?.equippedItems.get(slot) ?? null;
  }

  rarityBorderColor(item: Item | null): string {
    if (!item) return 'transparent';
    switch (item.rarity) {
      case ItemRarity.RARE: return '#60a5fa';
      case ItemRarity.EPIC: return '#c084fc';
      case ItemRarity.LEGENDARY: return '#fb923c';
      default: return '#92400e';
    }
  }

  async onPlayerHover(playerId: number) {
    clearTimeout(this.leaveTimeout);
    this.hoveredPlayerId.set(playerId);
    if (this.pinnedPlayerId() === null) {
      await this.loadPanelBuild(playerId);
    }
  }

  onPlayerLeave() {
    // Small delay so moving the mouse into the panel doesn't cause a flicker
    this.leaveTimeout = setTimeout(() => this.hoveredPlayerId.set(null), 80);
  }

  onPanelEnter() {
    clearTimeout(this.leaveTimeout);
    this.panelHovered.set(true);
  }

  onPanelLeave() {
    this.panelHovered.set(false);
  }

  async onPlayerClick(playerId: number) {
    if (this.pinnedPlayerId() === playerId) {
      this.pinnedPlayerId.set(null);
    } else {
      this.pinnedPlayerId.set(playerId);
      await this.loadPanelBuild(playerId);
    }
  }

  private async loadPanelBuild(playerId: number) {
    if (this.buildCache.has(playerId)) {
      this.panelBuild.set(this.buildCache.get(playerId)!);
      return;
    }
    this.panelLoading.set(true);
    try {
      const data = await fetch(`${environment.gameServer}/playerBuild?playerId=${playerId}`).then(r => r.json());
      const player = this.buildPlayerFromData(data);
      this.buildCache.set(playerId, player);
      this.panelBuild.set(player);
    } catch (e) {
      console.error('Error loading build:', e);
    } finally {
      this.panelLoading.set(false);
    }
  }

  ngOnInit() {
    this.playerId = Number(localStorage.getItem('playerId')) ?? 0;
    this.fetchPlayerData();
    this.intervalId = setInterval(() => this.fetchPlayerData(), 5000);

    this.infoBoxService.clearContent();
    this.infoBoxService.setPageDefault({
      title: 'End of Run',
      entries: [
        { icon: '🏆', label: 'Top Fighters', text: 'Hover or click a player to inspect their build.' },
        { icon: '⭐', label: 'Your Rank', text: 'Your rank is based on total wins. Keep playing to climb higher!' },
        { icon: '🔄', label: 'Play Again', text: 'Hit RESTART to try a new run with a different character or strategy.' },
      ],
    });
  }

  setTab(tab: 'all-time' | 'latest-version') {
    this.activeTab.set(tab);
  }

  currentTabPlayers() {
    return this.activeTab() === 'latest-version'
      ? this.topPlayersLatestVersion()
      : this.topPlayers();
  }

  async fetchPlayerData() {
    try {
      const [allTimeResults, latestVersionResults, playerRankResult] = await Promise.all([
        fetch(`${environment.gameServer}/topPlayers?numberOfPlayers=10`).then(res => res.json()),
        fetch(`${environment.gameServer}/topPlayersCurrentVersion?numberOfPlayers=10`).then(res => res.json()),
        fetch(`${environment.gameServer}/rank?playerId=${this.playerId}`).then(res => res.json()),
      ]);
      this.topPlayers.set(allTimeResults);
      this.topPlayersLatestVersion.set(latestVersionResults);
      this.playerRank.set(playerRankResult.rank);
      this.playerName.set(playerRankResult.name);
      this.playerWins.set(playerRankResult.wins);
    } catch (error) {
      console.error('Error fetching player data:', error);
    }
  }

  private buildItemFromData(itemData: any): Item {
    const { affectedStats, setBonusStats, affectedEnemyStats, triggerTypes, tags, ...primitives } = itemData;
    const item = new Item();
    const primitiveFields = ['itemId', 'name', 'description', 'price', 'sellPrice', 'setActive',
      'tier', 'rarity', 'image', 'sold', 'equipped', 'type', 'set', 'showDetails',
      'baseMinDamage', 'baseMaxDamage', 'baseAttackSpeed'];
    primitiveFields.forEach(f => { if (primitives[f] !== undefined) try { (item as any)[f] = primitives[f]; } catch {} });
    if (affectedStats) { const s = new AffectedStats(); Object.assign(s, affectedStats); item.affectedStats = s; }
    if (setBonusStats) { const s = new AffectedStats(); Object.assign(s, setBonusStats); item.setBonusStats = s; }
    if (affectedEnemyStats) { const s = new AffectedStats(); Object.assign(s, affectedEnemyStats); item.affectedEnemyStats = s; }
    if (triggerTypes?.length) item.triggerTypes = new ArraySchema<string>(...triggerTypes);
    if (tags?.length) item.tags = new ArraySchema<string>(...tags);
    return item;
  }

  private buildPlayerFromData(data: any): Player {
    const player = new Player();
    const primitiveFields = ['playerId', 'originalPlayerId', 'name', 'gold', 'xp', 'level',
      'sessionId', 'maxXp', 'round', 'lives', 'wins', 'avatarUrl', 'gameVersion',
      'income', 'hpRegen', 'dodgeRate', 'refreshShopCost', 'maxHp', 'hp',
      'strength', 'accuracy', 'defense', 'attackSpeed', 'flatDmgReduction'];
    primitiveFields.forEach(f => { if (data[f] !== undefined) try { (player as any)[f] = data[f]; } catch {} });
    if (data.baseStats) Object.assign(player.baseStats, data.baseStats);
    const equippedMap = new MapSchema<Item>();
    if (data.equippedItems) {
      Object.entries(data.equippedItems).forEach(([slot, itemData]) => {
        equippedMap.set(slot, this.buildItemFromData(itemData as any));
      });
    }
    player.equippedItems = equippedMap;
    const talentsSchema = new ArraySchema<Talent>();
    (data.talents || []).forEach((t: any) => {
      const { affectedStats, affectedEnemyStats, triggerTypes, tags, ...primitives } = t;
      const talent = new Talent();
      Object.keys(primitives).forEach(f => { try { (talent as any)[f] = primitives[f]; } catch {} });
      if (affectedStats) Object.assign(talent.affectedStats, affectedStats);
      if (affectedEnemyStats) Object.assign(talent.affectedEnemyStats, affectedEnemyStats);
      if (triggerTypes?.length) talent.triggerTypes = new ArraySchema<string>(...triggerTypes);
      if (tags?.length) talent.tags = new ArraySchema<string>(...tags);
      talentsSchema.push(talent);
    });
    player.talents = talentsSchema;
    const inventorySchema = new ArraySchema<Item>();
    (data.inventory || []).forEach((itemData: any) => inventorySchema.push(this.buildItemFromData(itemData)));
    player.inventory = inventorySchema;
    return player;
  }

  goToHome() {
    localStorage.removeItem('sessionId');
    localStorage.removeItem('playerId');
    localStorage.removeItem('roomId');
    localStorage.removeItem('reconnectToken');
    this.router.navigate(['/']);
  }

  topListContainsPlayer() {
    return this.currentTabPlayers().some(player => player.playerId === this.playerId);
  }

  ngOnDestroy() {
    if (this.intervalId) clearInterval(this.intervalId);
    this.infoBoxService.clearPageDefault();
    this.infoBoxService.clearContent();
  }
}
