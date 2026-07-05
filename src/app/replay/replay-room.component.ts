import {
  AfterViewInit,
  Component,
  Inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  Renderer2,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Player } from '../models/colyseus-schema/PlayerSchema';
import { Talent } from '../models/colyseus-schema/TalentSchema';
import Item from '../models/colyseus-schema/ItemSchema';
import { AffectedStats } from '../models/colyseus-schema/AffectedStatsSchema';
import { ArraySchema, MapSchema } from '@colyseus/schema';
import { CombatLogEntry } from '../models/types/CombatLogEntry';
import { CombatLogComponent } from '../fight/components/combat-log/combat-log.component';
import { CharacterDetailsComponent } from '../common/components/character-details/character-details.component';
import { DraggablePanelDirective } from '../common/directives/draggable-panel.directive';
import { FightAnimationService, AnimationContext } from '../fight/services/fight-animation.service';
import { InfoBoxService } from '../common/services/info-box.service';
import { environment } from '../../environments/environment';
import { FightStatsMessage } from '../models/types/MessageTypes';
import { MatDialog } from '@angular/material/dialog';
import { FightStatsDialogComponent } from '../common/components/fight-stats-dialog/fight-stats-dialog.component';

// Mirrors backend playerToPlainObject → rehydrates a plain snapshot into a typed Player.
function rehydrateItem(raw: any): Item {
  const item = new Item();
  const NESTED = new Set(['affectedStats', 'affectedEnemyStats', 'tags', 'itemCollections', 'triggerTypes', 'equipOptions']);
  for (const key of Object.keys(raw ?? {})) {
    if (NESTED.has(key)) continue;
    try { (item as any)[key] = raw[key]; } catch {}
  }
  if (raw?.affectedStats) Object.assign(item.affectedStats, raw.affectedStats);
  if (raw?.affectedEnemyStats) Object.assign(item.affectedEnemyStats, raw.affectedEnemyStats);
  (raw?.tags ?? []).forEach((t: string) => item.tags.push(t));
  (raw?.itemCollections ?? []).forEach((c: number) => item.itemCollections.push(c));
  (raw?.triggerTypes ?? []).forEach((t: string) => item.triggerTypes.push(t));
  return item;
}

function rehydrateTalent(raw: any): Talent {
  const t = new Talent();
  const NESTED = new Set(['affectedStats', 'affectedEnemyStats', 'tags', 'triggerTypes']);
  for (const key of Object.keys(raw ?? {})) {
    if (NESTED.has(key)) continue;
    try { (t as any)[key] = raw[key]; } catch {}
  }
  if (raw?.affectedStats) Object.assign(t.affectedStats, raw.affectedStats);
  if (raw?.affectedEnemyStats) Object.assign(t.affectedEnemyStats, raw.affectedEnemyStats);
  (raw?.tags ?? []).forEach((tag: string) => t.tags.push(tag));
  (raw?.triggerTypes ?? []).forEach((tt: string) => t.triggerTypes.push(tt));
  return t;
}

function rehydratePlayer(snapshot: any): Player {
  const p = new Player();
  const NESTED = new Set(['equippedItems', 'inventory', 'talents', 'lockedShop', 'baseStats', 'activeItemCollections', 'availableItemCollections']);
  for (const key of Object.keys(snapshot ?? {})) {
    if (NESTED.has(key)) continue;
    try { (p as any)[key] = snapshot[key]; } catch {}
  }
  if (snapshot?.baseStats) {
    const stats = new AffectedStats();
    Object.assign(stats, snapshot.baseStats);
    p.baseStats = stats;
  }
  const equipped = new MapSchema<Item>();
  for (const [slot, item] of Object.entries(snapshot?.equippedItems ?? {})) {
    equipped.set(slot, rehydrateItem(item));
  }
  p.equippedItems = equipped;
  const inv = new ArraySchema<Item>();
  (snapshot?.inventory ?? []).forEach((item: any) => inv.push(rehydrateItem(item)));
  p.inventory = inv;
  const talents = new ArraySchema<Talent>();
  (snapshot?.talents ?? []).forEach((t: any) => talents.push(rehydrateTalent(t)));
  p.talents = talents;
  return p;
}

export interface ReplayListItem {
  replayId: string;
  round: number;
  playerName: string;
  enemyName: string;
  result: string;
  gameVersion: number;
  durationMs: number;
  createdAt: string;
  truncated: boolean;
  stats?: FightStatsMessage;
}

@Component({
  selector: 'app-replay-room',
  standalone: true,
  imports: [
    CharacterDetailsComponent,
    CombatLogComponent,
    DraggablePanelDirective,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './replay-room.component.html',
  styleUrl: './replay-room.component.scss',
})
export class ReplayRoomComponent implements OnInit, AfterViewInit, OnDestroy {
  player = signal<Player | null>(null, { equal: () => false });
  enemy = signal<Player | null>(null, { equal: () => false });
  entries = signal<CombatLogEntry[]>([]);
  playerBeingHit = signal(false);
  enemyBeingHit = signal(false);

  loading = signal(true);
  error = signal<string | null>(null);
  battleResult = signal<string | null>(null);
  truncated = signal(false);
  versionMismatch = signal(false);
  showResultBanner = signal(false);
  battleStats = signal<FightStatsMessage | null>(null);

  playing = signal(true);
  speed = signal(1);
  progressPct = signal(0);

  private events: any[] = [];
  private initialState: any = null;
  private eventIndex = 0;
  private virtualMs = 0;
  private durationMs = 0;
  private lastRafTs = 0;
  private rafId: number | null = null;
  done = false;
  private animCtx!: AnimationContext;

  constructor(
    private route: ActivatedRoute,
    private renderer: Renderer2,
    private fightAnimationService: FightAnimationService,
    private infoBoxService: InfoBoxService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private dialog: MatDialog,
  ) {}

  async ngOnInit(): Promise<void> {
    this.infoBoxService.hide();
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.error.set('No replay ID in URL.'); this.loading.set(false); return; }

    try {
      const replay = await this.fetchReplayWithRetry(id);
      if (!replay) { this.error.set('Replay not found.'); this.loading.set(false); return; }

      this.events = replay.events ?? [];
      this.initialState = replay.initialState;
      this.durationMs = replay.durationMs ?? (this.events.length ? this.events[this.events.length - 1].t : 0);
      const rawResult = replay.result ?? null;
      this.battleResult.set(rawResult === 'loose' ? 'lose' : rawResult);
      this.truncated.set(replay.truncated ?? false);
      this.battleStats.set(replay.stats ?? null);
      const replayVersion = replay.gameVersion ?? 0;
      const playerVersion = replay.initialState?.player?.gameVersion ?? replayVersion;
      this.versionMismatch.set(replayVersion !== playerVersion && replayVersion > 0);

      this.setupAnimCtx();
      this.initPlayers();
      this.loading.set(false);
    } catch {
      this.error.set('Failed to load replay.');
      this.loading.set(false);
    }
  }

  /** The replay save is fire-and-forget right after the fight ends, so clicking "Watch
   *  Replay" moments after the result modal appears can briefly 404 before the DB write
   *  lands. Retry a few times before giving up. */
  private async fetchReplayWithRetry(id: string, attempts = 4, delayMs = 600): Promise<any | null> {
    for (let i = 0; i < attempts; i++) {
      const resp = await fetch(`${environment.gameServer}/replays/${id}`);
      if (resp.ok) return resp.json();
      if (resp.status !== 404 || i === attempts - 1) return null;
      await new Promise(r => setTimeout(r, delayMs));
    }
    return null;
  }

  ngAfterViewInit(): void {
    // Start the scheduler only in the browser, after the DOM is ready.
    if (isPlatformBrowser(this.platformId)) {
      this.rafId = requestAnimationFrame(this.tick);
    }
  }

  ngOnDestroy(): void {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.infoBoxService.show();
  }

  private setupAnimCtx(): void {
    this.animCtx = {
      renderer: this.renderer,
      platformId: this.platformId,
      player: this.player,
      enemy: this.enemy,
      entries: this.entries,
      triggerAttack: (_id) => { /* no sounds in replay */ },
      triggerDamagedAvatar: (id) => {
        this.fightAnimationService.applyTriggerAvatarHit(id);
        const p = this.player();
        if (p && p.playerId === id) {
          this.playerBeingHit.set(true);
          setTimeout(() => this.playerBeingHit.set(false), 200);
        } else {
          this.enemyBeingHit.set(true);
          setTimeout(() => this.enemyBeingHit.set(false), 200);
        }
      },
      onEndBattle: (msg) => { this.battleResult.set(msg?.result ?? 'win'); this.showResultBanner.set(true); },
      onGameOver: (msg) => { this.battleResult.set(msg?.includes('lose') || msg?.toLowerCase().includes('lost') ? 'lose' : 'win'); this.showResultBanner.set(true); },
      onVersionWin: (_msg) => { this.battleResult.set('win'); this.showResultBanner.set(true); },
      applyHpDelta: (playerId, damage, healing) => {
        const p = this.player();
        const e = this.enemy();
        // Clamp at maxHp: old replays recorded overheal events (healing sent
        // while already at full HP), which would otherwise grow hp unbounded.
        if (p && p.playerId === playerId) {
          p.hp = Math.min(p.hp - damage + healing, p.maxHp);
          this.player.set(p);
        } else if (e && e.playerId === playerId) {
          e.hp = Math.min(e.hp - damage + healing, e.maxHp);
          this.enemy.set(e);
        }
      },
      setInvincible: (playerId, invincible) => {
        const p = this.player();
        const e = this.enemy();
        if (p && p.playerId === playerId) {
          p.invincible = invincible;
          this.player.set(p);
        } else if (e && e.playerId === playerId) {
          e.invincible = invincible;
          this.enemy.set(e);
        }
      },
    };
  }

  private initPlayers(): void {
    if (!this.initialState) return;
    const p = rehydratePlayer(this.initialState.player);
    const e = rehydratePlayer(this.initialState.enemy);
    this.player.set(p);
    this.enemy.set(e);
  }

  private tick = (timestamp: number): void => {
    if (!this.loading() && !this.done) {
      if (this.playing() && this.lastRafTs > 0) {
        const delta = timestamp - this.lastRafTs;
        this.virtualMs += delta * this.speed();
        if (this.durationMs > 0) {
          this.progressPct.set(Math.min(100, (this.virtualMs / this.durationMs) * 100));
        }
        while (this.eventIndex < this.events.length && this.events[this.eventIndex].t <= this.virtualMs) {
          const ev = this.events[this.eventIndex++];
          this.fightAnimationService.dispatch(this.animCtx, ev.type, ev.payload);
        }
        if (this.eventIndex >= this.events.length) {
          this.done = true;
          this.playing.set(false);
          this.progressPct.set(100);
          if (!this.showResultBanner()) {
            this.showResultBanner.set(true);
          }
        }
      }
      this.lastRafTs = timestamp;
    }
    this.rafId = this.done ? null : requestAnimationFrame(this.tick);
  };

  togglePlay(): void {
    if (this.done) { this.restart(); return; }
    this.playing.update(v => !v);
    if (!this.playing()) {
      // Pause: freeze lastRafTs so the next resume doesn't accumulate a gap
      this.lastRafTs = 0;
    }
  }

  setSpeed(s: number): void {
    this.speed.set(s);
  }

  restart(): void {
    this.done = false;
    this.eventIndex = 0;
    this.virtualMs = 0;
    this.lastRafTs = 0;
    this.progressPct.set(0);
    this.entries.set([]);
    this.showResultBanner.set(false);
    this.initPlayers();
    this.playing.set(true);
    if (this.rafId === null && isPlatformBrowser(this.platformId)) {
      this.rafId = requestAnimationFrame(this.tick);
    }
  }

  openStats(): void {
    const stats = this.battleStats();
    if (!stats) return;
    this.dialog.open(FightStatsDialogComponent, {
      data: { playerName: this.player()?.name ?? 'Player', enemyName: this.enemy()?.name ?? 'Enemy', stats },
      backdropClass: 'chungus-dialog-backdrop',
      autoFocus: false,
    });
  }

  /** Closes this replay tab so the browser returns focus to the live game tab beneath it. */
  closeTab(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.close();
    }
  }
}
