import { Component, ElementRef, ViewChild, Renderer2, AfterViewInit, OnDestroy, OnInit, signal, computed, PLATFORM_ID, Inject } from '@angular/core';
import { DatePipe, isPlatformBrowser, NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReplayListItem } from '../replay/replay-room.component';
import { Router } from '@angular/router';
import { Player } from '../models/colyseus-schema/PlayerSchema';
import { environment } from '../../environments/environment';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { InfoBoxService } from '../common/services/info-box.service';
import { SeasonsService } from '../common/services/seasons.service';
import { itemPictures } from '../common/item-image-links';
import { buildPlayerFromData } from '../common/utils/player-schema-builder';
import { DraggablePanelDirective } from '../common/directives/draggable-panel.directive';
import { PlayerBuildCardComponent } from '../common/components/player-build-card/player-build-card.component';
import { MatDialog } from '@angular/material/dialog';
import { FightStatsDialogComponent } from '../common/components/fight-stats-dialog/fight-stats-dialog.component';

@Component({
  selector: 'app-end',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, DatePipe, NgTemplateOutlet, DraggablePanelDirective, RouterLink, PlayerBuildCardComponent],
  templateUrl: './end.component.html',
  styleUrl: './end.component.scss',
})
export class EndComponent implements OnInit, AfterViewInit, OnDestroy {
  message: string = 'Game Over';
  leaderboardPlayers = signal<Player[]>([]);
  totalCount = signal<number>(0);
  readonly pageSize = 10;
  currentPage = signal<number>(0);
  totalPages = computed(() => Math.max(1, Math.ceil(this.totalCount() / this.pageSize)));

  filterName = signal<string>('');
  filterAvatar = signal<string>('');
  filterCurrentVersionOnly = signal<boolean>(true);
  currentSeason = signal<number>(0);

  readonly avatarOptions: { label: string; value: string }[] = [
    { label: 'All classes', value: '' },
    { label: 'Thief', value: 'assets/thief_01.png' },
    { label: 'Warrior', value: 'assets/warrior_01.png' },
    { label: 'Merchant', value: 'assets/merchant_01.png' },
  ];

  playerId: number = 0;
  playerRank = signal<number>(0);
  playerName = signal<string>('');
  playerWins = signal<number>(0);

  originalPlayerId = signal<number>(0);
  replaysOpen = signal(false);
  replaysPlayerName = signal<string>('');
  replaysPlayerOriginalId = signal<number>(0);
  replays = signal<ReplayListItem[]>([]);
  replaysLoading = signal(false);
  private replaysCache = new Map<number, ReplayListItem[]>();

  hoveredPlayerId = signal<number | null>(null);
  pinnedPlayerIds = signal<number[]>([]);
  pinnedBuilds = signal<Map<number, Player>>(new Map());
  panelBuild = signal<Player | null>(null);
  panelLoading = signal(false);
  panelHovered = signal(false);

  @ViewChild('fallingItemsContainer', { static: false })
  fallingItemsContainer!: ElementRef<HTMLDivElement>;
  fallingItems = itemPictures;

  private buildCache = new Map<number, Player>();
  private pinnedPanelLeftMap = new Map<number, number>();
  private intervalId: any;
  private fallingItemsIntervalId: any;

  constructor(
    private router: Router,
    private infoBoxService: InfoBoxService,
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) private platformId: Object,
    private seasonsService: SeasonsService,
    private dialog: MatDialog,
  ) {}

  get infoBoxVisible() {
    return this.infoBoxService.isVisible;
  }

  toggleInfoBox() {
    this.infoBoxService.toggle();
  }

  isPanelVisible(): boolean {
    const hovered = this.hoveredPlayerId();
    return this.panelBuild() !== null &&
      ((hovered !== null && !this.isPinned(hovered)) || this.panelHovered());
  }

  isPinned(playerId: number): boolean {
    return this.pinnedPlayerIds().includes(playerId);
  }

  isActive(playerId: number): boolean {
    return this.isPinned(playerId) || this.hoveredPlayerId() === playerId;
  }

  getPinnedBuild(playerId: number): Player | null {
    return this.pinnedBuilds().get(playerId) ?? null;
  }

  pinnedPanelInitialLeft(pinnedId: number): number {
    return this.pinnedPanelLeftMap.get(pinnedId) ?? 16;
  }

  async onPlayerHover(playerId: number) {
    this.hoveredPlayerId.set(playerId);
    if (!this.isPinned(playerId)) {
      await this.loadPanelBuild(playerId);
    }
  }

  onPlayerLeave() {
    this.hoveredPlayerId.set(null);
  }

  onPanelEnter() {
    this.panelHovered.set(true);
  }

  onPanelLeave() {
    this.panelHovered.set(false);
  }

  async onPlayerClick(playerId: number) {
    if (this.isPinned(playerId)) {
      this.unpinPlayer(playerId);
    } else {
      this.pinnedPanelLeftMap.set(playerId, 16 + this.pinnedPlayerIds().length * 356);
      this.pinnedPlayerIds.update(ids => [...ids, playerId]);
      await this.loadPinnedBuild(playerId);
    }
  }

  unpinPlayer(playerId: number) {
    this.pinnedPlayerIds.update(ids => ids.filter(id => id !== playerId));
    this.pinnedBuilds.update(m => { const next = new Map(m); next.delete(playerId); return next; });
    this.pinnedPanelLeftMap.delete(playerId);
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

  private async loadPinnedBuild(playerId: number) {
    if (this.pinnedBuilds().has(playerId)) return;
    let player: Player | undefined = this.buildCache.get(playerId);
    if (!player) {
      try {
        const data = await fetch(`${environment.gameServer}/playerBuild?playerId=${playerId}`).then(r => r.json());
        player = buildPlayerFromData(data);
        this.buildCache.set(playerId, player);
      } catch (e) {
        console.error('Error loading build:', e);
        return;
      }
    }
    this.pinnedBuilds.update(m => new Map(m).set(playerId, player!));
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.playerId = Number(localStorage.getItem('playerId')) ?? 0;
    }
    this.seasonsService.getSeasons().then(data => this.currentSeason.set(data.currentSeason));
    this.fetchPlayerData();
    this.intervalId = setInterval(() => this.fetchPlayerData(), 5000);

    this.infoBoxService.clearContent();
    this.infoBoxService.setPageDefault({
      id: 'end-of-run',
      title: 'End of Run',
      entries: [
        { icon: '🏆', label: 'Top Fighters', text: 'Hover or click a player to inspect their build.' },
        { icon: '⭐', label: 'Your Rank', text: 'Your rank is based on total wins. Keep playing to climb higher!' },
        { icon: '🔄', label: 'Play Again', text: 'Hit RESTART to try a new run with a different character or strategy.' },
      ],
    });
  }

  private nameDebounceTimer: any;

  onFilterNameInput(value: string): void {
    this.filterName.set(value);
    clearTimeout(this.nameDebounceTimer);
    this.nameDebounceTimer = setTimeout(() => {
      this.currentPage.set(0);
      this.fetchLeaderboard();
    }, 300);
  }

  setFilterAvatar(value: string): void {
    this.filterAvatar.set(value);
    this.currentPage.set(0);
    this.fetchLeaderboard();
  }


  setVersionFilter(currentOnly: boolean): void {
    this.filterCurrentVersionOnly.set(currentOnly);
    this.currentPage.set(0);
    this.fetchLeaderboard();
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages() - 1) {
      this.currentPage.update(p => p + 1);
      this.fetchLeaderboard();
    }
  }

  prevPage(): void {
    if (this.currentPage() > 0) {
      this.currentPage.update(p => p - 1);
      this.fetchLeaderboard();
    }
  }

  private async fetchLeaderboard(rankForOriginalPlayerId?: number): Promise<void> {
    try {
      const params = new URLSearchParams({ limit: String(this.pageSize), skip: String(this.currentPage() * this.pageSize) });
      if (this.filterCurrentVersionOnly()) params.set('currentVersion', 'true');
      if (this.filterName()) params.set('name', this.filterName());
      if (this.filterAvatar()) params.set('avatar', this.filterAvatar());
      const origId = rankForOriginalPlayerId ?? this.originalPlayerId();
      if (origId) params.set('rankForOriginalPlayerId', String(origId));
      const result = await fetch(`${environment.gameServer}/leaderboard?${params}`).then(r => r.json());
      this.leaderboardPlayers.set(Array.isArray(result.players) ? result.players : []);
      this.totalCount.set(typeof result.total === 'number' ? result.total : 0);
      if (typeof result.userRank === 'number') this.playerRank.set(result.userRank);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  }

  async fetchPlayerData(): Promise<void> {
    try {
      const playerRankResult = await fetch(`${environment.gameServer}/rank?playerId=${this.playerId}`).then(res => res.json());
      this.playerName.set(playerRankResult.name);
      this.playerWins.set(playerRankResult.wins);
      const origId = playerRankResult.originalPlayerId ?? this.originalPlayerId();
      if (playerRankResult.originalPlayerId) this.originalPlayerId.set(playerRankResult.originalPlayerId);
      await this.fetchLeaderboard(origId);
    } catch (error) {
      console.error('Error fetching player data:', error);
    }
  }

  async openReplays(originalPlayerId: number, displayName: string): Promise<void> {
    this.replaysPlayerName.set(displayName);
    this.replaysPlayerOriginalId.set(originalPlayerId);
    this.replaysOpen.set(true);
    const cached = this.replaysCache.get(originalPlayerId);
    if (cached) { this.replays.set(cached); return; }
    this.replaysLoading.set(true);
    try {
      const data = await fetch(`${environment.gameServer}/replays?originalPlayerId=${originalPlayerId}`).then(r => r.json());
      const list = Array.isArray(data) ? data.reverse() : [];
      this.replaysCache.set(originalPlayerId, list);
      this.replays.set(list);
    } catch {
      this.replays.set([]);
    } finally {
      this.replaysLoading.set(false);
    }
  }

  closeReplays(): void {
    this.replaysOpen.set(false);
  }

  replayResultLabel(result: string): string {
    if (result === 'win') return '⚔️ Win';
    if (result === 'lose' || result === 'loose') return '🛡️ Loss';
    return '⚡ Draw';
  }

  openStats(r: ReplayListItem, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (!r.stats) return;
    this.dialog.open(FightStatsDialogComponent, {
      data: { playerName: r.playerName, enemyName: r.enemyName, stats: r.stats },
      backdropClass: 'chungus-dialog-backdrop',
      autoFocus: false,
    });
  }

  jumpToMe(): void {
    const rank = this.playerRank();
    if (rank <= 0) return;
    this.filterName.set('');
    this.filterAvatar.set('');
    this.currentPage.set(Math.floor((rank - 1) / this.pageSize));
    this.fetchLeaderboard();
  }

  goToHome() {
    localStorage.removeItem('sessionId');
    localStorage.removeItem('playerId');
    localStorage.removeItem('roomId');
    localStorage.removeItem('reconnectToken');
    this.router.navigate(['/']);
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
    clearTimeout(this.nameDebounceTimer);
    this.infoBoxService.clearPageDefault();
    this.infoBoxService.clearContent();
  }
}
