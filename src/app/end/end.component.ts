import { Component, ElementRef, ViewChild, Renderer2, AfterViewInit, OnDestroy, OnInit, signal, computed, PLATFORM_ID, Inject } from '@angular/core';
import { DatePipe, isPlatformBrowser, NgTemplateOutlet } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
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
import { GameStatsResult, Tournament, TournamentPairing, TournamentStandingRow } from '../models/types/MessageTypes';
import { TimeAgoPipe } from '../common/pipes/time-ago.pipe';
import { SoundsService } from '../common/services/sounds.service';

@Component({
  selector: 'app-end',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, DatePipe, NgTemplateOutlet, DraggablePanelDirective, RouterLink, PlayerBuildCardComponent, TimeAgoPipe],
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
  filterMinWins = signal<number | null>(null);
  activeTab = signal<'fame' | 'all'>('fame');
  currentSeason = signal<number>(0);

  /** Wall of Fame season filter — defaults to the current season once /seasons resolves. */
  fameSeasonOptions = signal<{ label: string; value: number }[]>([]);
  fameSeason = signal<number>(0);

  /** Season-end tournament (fame tab only) — null while loading/absent, cached per season since
   *  a completed season's tournament never changes. */
  tournament = signal<Tournament | null>(null);
  tournamentStandingsOpen = signal(false);
  private tournamentCache = new Map<number, Tournament | null>();
  tournamentBuildOpen = signal(false);
  tournamentBuildName = signal<string>('');
  tournamentBuildPlayer = signal<Player | null>(null);

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
  private gameStatsCache = new Map<number, GameStatsResult>();
  private pinnedPanelLeftMap = new Map<number, number>();
  private intervalId: any;
  private fallingItemsIntervalId: any;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private infoBoxService: InfoBoxService,
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) private platformId: Object,
    private seasonsService: SeasonsService,
    private dialog: MatDialog,
    private soundsService: SoundsService,
  ) {}

  get infoBoxVisible() {
    return this.infoBoxService.isVisible;
  }

  toggleInfoBox() {
    this.infoBoxService.toggle();
  }

  get volumeIcon(): string {
    return this.soundsService.volumeIcon;
  }

  cycleVolume(): void {
    this.soundsService.cycleVolume();
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

  /** Below this width there's no room for multiple side-by-side build panels — matches
   *  the breakpoint in .build-panel's mobile media query in end.component.scss. */
  isMobileViewport(): boolean {
    return isPlatformBrowser(this.platformId) && window.innerWidth <= 900;
  }

  /** Desktop only: touch devices have no real hover, so a synthesized mouseenter right
   *  before a tap's click would otherwise race onRowActivate's explicit toggle. */
  async onPlayerHover(playerId: number) {
    if (this.isMobileViewport()) return;
    this.hoveredPlayerId.set(playerId);
    if (!this.isPinned(playerId)) {
      await this.loadPanelBuild(playerId);
    }
  }

  onPlayerLeave() {
    if (this.isMobileViewport()) return;
    this.hoveredPlayerId.set(null);
  }

  /** Desktop only. On mobile a tap inside the panel synthesizes a mouseenter with no
   *  matching mouseleave ever following, which would otherwise latch panelHovered() true
   *  forever and keep isPanelVisible() true even after closeMobilePanel() runs. */
  onPanelEnter() {
    if (this.isMobileViewport()) return;
    this.panelHovered.set(true);
  }

  onPanelLeave() {
    if (this.isMobileViewport()) return;
    this.panelHovered.set(false);
  }

  /** Routes a row tap/click to the right interaction model: mobile has no hover and no
   *  room for side-by-side panels, so pinning is desktop-only there — a tap just opens or
   *  closes a single preview panel instead. */
  async onRowActivate(playerId: number): Promise<void> {
    if (this.isMobileViewport()) {
      if (this.hoveredPlayerId() === playerId) {
        this.hoveredPlayerId.set(null);
      } else {
        this.hoveredPlayerId.set(playerId);
        await this.loadPanelBuild(playerId);
      }
      return;
    }
    await this.onPlayerClick(playerId);
  }

  /** Closes the mobile single-preview panel (its equivalent of "unpin"). */
  closeMobilePanel(): void {
    this.hoveredPlayerId.set(null);
  }

  /** Mobile only: tapping anywhere outside the preview panel (and outside the row that
   *  opened it — that tap is handled by onRowActivate) closes it. Mirrors the same
   *  tap-outside-to-collapse pattern used by CharacterDetailsComponent. */
  private readonly onDocumentPointerDown = (e: PointerEvent): void => {
    if (!this.isMobileViewport()) return;
    if (this.hoveredPlayerId() === null) return;
    const target = e.target as HTMLElement | null;
    if (!target) return;
    if (target.closest('.build-panel')) return;
    if (target.closest('.player-row')) return;
    // Tap inside a CDK overlay (item card, talent card, stats info card, dialogs) — these are
    // portalled to document.body, outside .build-panel, so keep the panel open.
    if (target.closest('.cdk-overlay-container')) return;
    this.closeMobilePanel();
  };

  private async onPlayerClick(playerId: number) {
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
      document.addEventListener('pointerdown', this.onDocumentPointerDown, true);
    }
    // Lets the admin panel's "View Results" link (POST /admin/tournament flow) land directly
    // on the season it just ran, instead of the visitor having to reselect it from the dropdown.
    const seasonParam = Number(this.route.snapshot.queryParamMap.get('season'));
    this.seasonsService.getSeasons().then(data => {
      this.currentSeason.set(data.currentSeason);
      const fameSeasons = data.seasons
        .filter(s => s.number >= 16) // Wall of Fame was introduced in Season 16
        .map(s => ({ label: `Season ${s.number} — ${s.name}`, value: s.number }));
      this.fameSeasonOptions.set([{ label: 'All Seasons', value: 0 }, ...fameSeasons]);
      this.fameSeason.set(seasonParam > 0 ? seasonParam : data.currentSeason);
      if (this.activeTab() === 'fame') {
        this.currentPage.set(0);
        this.fetchLeaderboard();
        this.fetchTournament();
      }
    });
    this.fetchPlayerData();
    this.intervalId = setInterval(() => this.fetchPlayerData(), 5000);

    this.infoBoxService.clearContent();
    this.infoBoxService.setPageDefault({
      id: 'end-of-run',
      title: 'End of Run',
      entries: [
        { icon: '🏆', label: 'Wall of Fame', text: 'Characters who reached 12 wins, ranked by most runs ended (most recent breaks ties).' },
        { icon: '🔍', label: 'All Characters', text: 'Search every character by name, class, or minimum wins, and inspect their build.' },
        { icon: '📈', label: 'Game Stats', text: 'Click Game Stats next to a Replays button to see a character\'s cumulative stats across the whole run.' },
        { icon: '🔄', label: 'Play Again', text: 'Hit RESTART to try a new run with a different character or strategy.' },
      ],
    });
  }

  private nameDebounceTimer: any;
  private minWinsDebounceTimer: any;

  onFilterNameInput(value: string): void {
    this.filterName.set(value);
    clearTimeout(this.nameDebounceTimer);
    this.nameDebounceTimer = setTimeout(() => {
      this.currentPage.set(0);
      this.fetchLeaderboard();
    }, 300);
  }

  onFilterMinWinsInput(value: string): void {
    const n = value.trim() === '' ? null : Number(value);
    this.filterMinWins.set(n !== null && Number.isFinite(n) ? n : null);
    clearTimeout(this.minWinsDebounceTimer);
    this.minWinsDebounceTimer = setTimeout(() => {
      this.currentPage.set(0);
      this.fetchLeaderboard();
    }, 300);
  }

  setFilterAvatar(value: string): void {
    this.filterAvatar.set(value);
    this.currentPage.set(0);
    this.fetchLeaderboard();
  }

  setFameSeason(value: string): void {
    this.fameSeason.set(Number(value));
    this.currentPage.set(0);
    this.fetchLeaderboard();
    this.fetchTournament();
  }

  setTab(tab: 'fame' | 'all'): void {
    this.activeTab.set(tab);
    this.currentPage.set(0);
    this.fetchLeaderboard();
    if (tab === 'fame') this.fetchTournament();
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

      if (this.activeTab() === 'fame') {
        if (this.fameSeason()) params.set('season', String(this.fameSeason()));
        const result = await fetch(`${environment.gameServer}/wallOfFame?${params}`).then(r => r.json());
        this.leaderboardPlayers.set(Array.isArray(result.players) ? result.players : []);
        this.totalCount.set(typeof result.total === 'number' ? result.total : 0);
        return;
      }

      if (this.filterName()) params.set('name', this.filterName());
      if (this.filterAvatar()) params.set('avatar', this.filterAvatar());
      if (this.filterMinWins() !== null) params.set('minWins', String(this.filterMinWins()));
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
      const response = await fetch(`${environment.gameServer}/rank?playerId=${this.playerId}`);
      if (response.ok) {
        const playerRankResult = await response.json();
        this.playerName.set(playerRankResult.name);
        this.playerWins.set(playerRankResult.wins);
        if (playerRankResult.originalPlayerId) this.originalPlayerId.set(playerRankResult.originalPlayerId);
      }
      await this.fetchLeaderboard(this.originalPlayerId());
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

  /** Clicking a row opens its stats first — replay playback is a secondary action reachable
   *  from the stats popup's Watch Replay button. Rows without recorded stats (old replays)
   *  fall through to the row's own routerLink and start playback directly. */
  onRowClick(r: ReplayListItem, event: Event): void {
    if (!r.stats) return;
    event.preventDefault();
    this.dialog.open(FightStatsDialogComponent, {
      data: { playerName: r.playerName, enemyName: r.enemyName, stats: r.stats, replayId: r.replayId },
      backdropClass: 'chungus-dialog-backdrop',
      autoFocus: false,
    });
  }

  jumpToMe(): void {
    const rank = this.playerRank();
    if (rank <= 0) return;
    this.filterName.set('');
    this.filterAvatar.set('');
    this.filterMinWins.set(null);
    this.currentPage.set(Math.floor((rank - 1) / this.pageSize));
    this.fetchLeaderboard();
  }

  async openGameStats(originalPlayerId: number, name: string): Promise<void> {
    let result = this.gameStatsCache.get(originalPlayerId);
    if (!result) {
      try {
        result = await fetch(`${environment.gameServer}/gameStats?originalPlayerId=${originalPlayerId}`).then(r => r.json());
        this.gameStatsCache.set(originalPlayerId, result!);
      } catch (e) {
        console.error('Error loading game stats:', e);
        return;
      }
    }
    if (!result || result.fights === 0) return;
    this.dialog.open(FightStatsDialogComponent, {
      data: {
        playerName: name,
        enemyName: 'All Opponents',
        stats: result.stats,
        subtitle: `${result.fights} fights — ${result.wins}W / ${result.losses}L / ${result.draws}D`,
      },
      backdropClass: 'chungus-dialog-backdrop',
      autoFocus: false,
    });
  }

  // -------------------------------------------------------------------------
  // Season-end tournament (fame tab)
  // -------------------------------------------------------------------------

  private async fetchTournament(): Promise<void> {
    const season = this.fameSeason();
    if (!season) { this.tournament.set(null); return; } // "All Seasons" has no single tournament
    const cached = this.tournamentCache.get(season);
    if (cached !== undefined) { this.tournament.set(cached); return; }
    try {
      const resp = await fetch(`${environment.gameServer}/tournament?season=${season}`);
      const result = resp.ok ? await resp.json() as Tournament : null;
      this.tournamentCache.set(season, result);
      this.tournament.set(result);
    } catch (e) {
      console.error('Error fetching tournament:', e);
      this.tournament.set(null);
    }
  }

  tournamentNameFor(originalPlayerId: number): string {
    const t = this.tournament();
    return t?.roster.find(r => r.originalPlayerId === originalPlayerId)?.name ?? '?';
  }

  tournamentRunnerUpName(): string {
    const t = this.tournament();
    if (!t?.runnerUpId) return '';
    return this.tournamentNameFor(t.runnerUpId);
  }

  /** One replay per gauntlet pairing that had a showcase saved — the closest-finish game of
   *  that pairing (see backend TournamentRunner.ts). Skips pairings with no games yet (an
   *  in-progress tournament) or none close enough to warrant a kept replay. */
  tournamentShowcasePairings(): TournamentPairing[] {
    return (this.tournament()?.gauntlet.pairings ?? []).filter(p => p.showcaseReplayId);
  }

  toggleTournamentStandings(): void {
    this.tournamentStandingsOpen.update(v => !v);
  }

  /** Shows a tournament participant's frozen winning build (the exact snapshot they fought
   *  the tournament with), reusing the same rehydration buildPlayerFromData uses for
   *  /playerBuild — snapshotPlayer's shape on the backend is compatible with it. */
  openTournamentBuild(row: TournamentStandingRow): void {
    const entry = this.tournament()?.roster.find(r => r.originalPlayerId === row.originalPlayerId);
    if (!entry) return;
    if (!entry.snapshot) return;
    this.tournamentBuildName.set(row.name);
    this.tournamentBuildPlayer.set(buildPlayerFromData(entry.snapshot));
    this.tournamentBuildOpen.set(true);
  }

  closeTournamentBuild(): void {
    this.tournamentBuildOpen.set(false);
  }

  openChampionBuild(): void {
    const t = this.tournament();
    if (!t?.championId) return;
    const row = t.gauntlet.table.find(r => r.originalPlayerId === t.championId);
    if (row) this.openTournamentBuild(row);
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
    clearTimeout(this.minWinsDebounceTimer);
    this.infoBoxService.clearPageDefault();
    this.infoBoxService.clearContent();
    if (isPlatformBrowser(this.platformId)) {
      document.removeEventListener('pointerdown', this.onDocumentPointerDown, true);
    }
  }
}
