import { Component, ElementRef, ViewChild, Renderer2, AfterViewInit, OnDestroy, OnInit, signal, PLATFORM_ID, Inject } from '@angular/core';
import { DecimalPipe, isPlatformBrowser } from '@angular/common';
import { InfoHintDirective } from '../common/directives/info-hint.directive';
import { InfoContent } from '../common/models/info-content';
import { ActivatedRoute, Router } from '@angular/router';
import { Player } from '../models/colyseus-schema/PlayerSchema';
import Item from '../models/colyseus-schema/ItemSchema';
import { environment } from '../../environments/environment';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { InfoBoxService } from '../common/services/info-box.service';
import { EquipSlot, ItemRarity } from '../models/types/ItemTypes';
import { ItemHoverCardDirective } from '../common/directives/item-hover-card.directive';
import { SkillIconsComponent } from '../common/components/skill-icons/skill-icons.component';
import { itemPictures } from '../common/item-image-links';
import { buildPlayerFromData } from '../common/utils/player-schema-builder';

@Component({
  selector: 'app-end',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, ItemHoverCardDirective, SkillIconsComponent, DecimalPipe, InfoHintDirective],
  templateUrl: './end.component.html',
  styleUrl: './end.component.scss',
})
export class EndComponent implements OnInit, AfterViewInit, OnDestroy {
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
    [EquipSlot.HELMET, EquipSlot.MAIN_HAND, EquipSlot.OFF_HAND, EquipSlot.ARMOR],
  ];

  readonly slotIcons: Record<string, string> = {
    [EquipSlot.HELMET]:    '🪖',
    [EquipSlot.MAIN_HAND]: '⚔️',
    [EquipSlot.OFF_HAND]:  '🛡️',
    [EquipSlot.ARMOR]:     '🧥',
  };

  @ViewChild('fallingItemsContainer', { static: false })
  fallingItemsContainer!: ElementRef<HTMLDivElement>;
  fallingItems = itemPictures;

  private buildCache = new Map<number, Player>();
  private intervalId: any;
  private fallingItemsIntervalId: any;
  private leaveTimeout: any;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private infoBoxService: InfoBoxService,
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) private platformId: Object,
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
      const player = buildPlayerFromData(data);
      this.buildCache.set(playerId, player);
      this.panelBuild.set(player);
    } catch (e) {
      console.error('Error loading build:', e);
    } finally {
      this.panelLoading.set(false);
    }
  }

  get panelStatsHint(): InfoContent {
    const p = this.panelBuild();
    if (!p) return { title: 'Stats', entries: [] };
    const dodgeChance = Math.round(100 * (1 - 100 / (100 + p.dodgeRate)));
    const defenseReduction = Math.round(100 * (1 - 100 / (100 + p.defense)));
    return {
      title: `${p.name}'s Stats`,
      entries: [
        { icon: '❤️', label: 'Health',              text: `${Math.round(p.maxHp)} HP total.`,                                                              color: 'text-pink-500' },
        { icon: '🎯', label: 'Accuracy',             text: `+${p.accuracy?.toFixed(1)} added to weapon's minimum damage roll.`,                             color: 'text-red-400' },
        { icon: '⚔️', label: 'Strength',             text: `+${p.strength?.toFixed(1)} added to weapon's maximum damage roll.`,                             color: 'text-red-400' },
        { icon: '⏩', label: 'Speed Bonus',           text: `${((p.attackSpeed - 1) * 100)?.toFixed(0)}% multiplier applied to all weapon attack speeds.`,   color: 'text-blue-400' },
        { icon: '💰', label: 'Income',               text: `+${p.income} bonus gold earned at the end of each fight.`,                                      color: 'text-yellow-400' },
        { icon: '🧪', label: 'HP Regen',             text: `Recover ${p.hpRegen?.toFixed(3)} HP every second during battle.`,                               color: 'text-orange-400' },
        { icon: '🔰', label: 'Flat Damage Reduction',text: `Reduces all incoming damage by ${p.flatDmgReduction?.toFixed(3)} flat.`,                        color: 'text-green-400' },
        { icon: '🛡️', label: 'Defense',              text: `Reduces incoming damage by ${defenseReduction}% (DR formula, ${p.defense?.toFixed(2)} defense).`, color: 'text-green-400' },
        { icon: '🦵', label: 'Dodge',                text: `${dodgeChance}% chance to completely dodge an incoming attack.`,                                 color: 'text-green-400' },
      ],
    };
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

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.fallingItemsIntervalId = setInterval(() => {
        this.triggerShowFallingItem(this.fallingItems[Math.floor(Math.random() * this.fallingItems.length)]);
      }, 1000);
    }
  }

  triggerShowFallingItem(itemPicture: string) {
    if (this.fallingItemsContainer) {
      const itemImg = this.renderer.createElement('img');
      this.renderer.setAttribute(itemImg, 'src', itemPicture);
      this.renderer.setStyle(itemImg, 'scale', '0.5');
      this.renderer.addClass(itemImg, 'animate-fall');
      this.renderer.addClass(itemImg, 'fixed');
      this.renderer.setStyle(itemImg, 'left', `${Math.random() * 100}%`);
      this.renderer.setStyle(itemImg, 'z-index', '-1');
      this.renderer.appendChild(this.fallingItemsContainer.nativeElement, itemImg);
      setTimeout(() => {
        this.renderer.removeChild(this.fallingItemsContainer.nativeElement, itemImg);
      }, 6000);
    }
  }

  ngOnDestroy() {
    if (this.intervalId) clearInterval(this.intervalId);
    if (this.fallingItemsIntervalId) clearInterval(this.fallingItemsIntervalId);
    this.infoBoxService.clearPageDefault();
    this.infoBoxService.clearContent();
  }
}
