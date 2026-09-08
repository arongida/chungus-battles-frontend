import {
  Component,
  effect,
  Inject,
  OnInit,
  PLATFORM_ID,
  Renderer2,
  signal,
  untracked,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FightService } from '../../services/fight.service';
import { Player } from '../../../models/colyseus-schema/PlayerSchema';
import {
  HealingMessage,
  DamageMessage,
  InvulnerableMessage,
  RewardGainMessage,
  TriggerTalentMessage,
  TriggerItemMessage,
  LossRewardChoice,
  LossRewardOptions,
  LossRewardResultMessage,
  FightStatsMessage,
  GameOverMessage,
  GameWinMessage,
} from '../../../models/types/MessageTypes';
import { CombatLogEntry } from '../../../models/types/CombatLogEntry';
import { CombatLogComponent } from '../combat-log/combat-log.component';
import { DraftService } from '../../../draft/services/draft.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { RunRegistryService } from '../../../common/services/run-registry.service';
import { RunResumeService } from '../../../common/services/run-resume.service';
import { ItemTrackingService } from '../../../common/services/item-tracking.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { FightStatsDialogComponent } from '../../../common/components/fight-stats-dialog/fight-stats-dialog.component';
import { triggerAvatarHit, triggerCelebrationFireworks } from '../../../common/TriggerAnimations';
import { RoundInfoComponent } from '../../../common/components/round-info/round-info.component';
import { CharacterDetailsComponent } from '../../../common/components/character-details/character-details.component';
import { SkillIconsComponent } from '../../../common/components/skill-icons/skill-icons.component';
import { DraftToolbarComponent } from '../../../common/components/draft-toolbar/draft-toolbar.component';
import { MusicOptions, SoundOptions, SoundsService } from '../../../common/services/sounds.service';
import { DraggablePanelDirective } from '../../../common/directives/draggable-panel.directive';
import { InfoHintDirective } from '../../../common/directives/info-hint.directive';
import { PanelLayoutService } from '../../../common/services/panel-layout.service';
import { AnimationContext, FightAnimationService } from '../../services/fight-animation.service';
import { InfoBoxService } from '../../../common/services/info-box.service';
import { ReplaysService } from '../../../common/services/replays.service';
import {
  battleWonHint,
  battleLostHint,
  battleDrawHint,
  runOverHint,
  gameWinHint,
  fightSpeedHint,
} from '../../../common/components/draft-toolbar/draft-toolbar.hints';
import { END_BURN_START_MS, WINS_TO_WIN } from '../../../common/constants/game';

// Creates a typed Player from any schema object (typed or reflection-decoded generic).
// Skips `baseStats` to avoid assertInstanceType failures in production minified builds.
function coercePlayer(src: any): Player {
  if (!src) return new Player();
  const dest = new Player();
  Object.keys(src).forEach(key => {
    if (key === 'baseStats') return;
    try { (dest as any)[key] = src[key]; } catch {}
  });
  return dest;
}

@Component({
  selector: 'app-fight-room',
  standalone: true,
  imports: [
    DraftToolbarComponent,
    CombatLogComponent,
    MatTooltipModule,
    MatButtonModule,
    MatIconModule,
    RoundInfoComponent,
    CharacterDetailsComponent,
    DraggablePanelDirective,
    InfoHintDirective,
  ],
  templateUrl: './fight-room.component.html',
  styleUrl: './fight-room.component.scss',
})
// Deliberately has NO ngOnDestroy/beforeunload cleanup that calls fightService.leave() on
// navigation away — that's load-bearing, not an oversight. leave() is a CONSENTED Colyseus
// leave, which skips the 30s allowReconnection window entirely (see FightRoom.onDrop on the
// backend): a beforeunload-triggered leave would kill tab-reload recovery, and an
// ngOnDestroy-triggered leave on back-button nav would force round++/a loss on a fight that
// never resolved. The room simply keeps running server-side (autoDispose = false) until the
// player reconnects, forfeits, or it resolves — runGuard (common/guards/run.guard.ts) is what
// routes a mid-fight run's "Resume" back here instead of into a stale draft room.
export class FightRoomComponent implements OnInit {
  /** The active run's playerId, from the route (:id) — set by runGuard before this component
   *  activates, so it's available immediately, unlike room.state.player which only populates
   *  after the join round-trip completes. */
  private get runPlayerId(): number {
    return Number(this.route.snapshot.paramMap.get('id'));
  }

  player = signal<Player | null>(null, { equal: () => false });
  enemy = signal<Player | null>(null, { equal: () => false });
  entries = signal<CombatLogEntry[]>([]);
  gameOver = false;
  battleOver = false;
  playerBeingHit = signal(false);
  enemyBeingHit = signal(false);
  gameWin = signal(false);
  gameWinWins = signal(0);
  gameWinLosses = signal(0);
  gameWinMinimized = signal(false);
  battleResultVisible = signal(false);
  battleResult = signal<'win' | 'lose' | 'draw'>('win');
  battleResultMinimized = signal(false);
  lossRewardOptions = signal<LossRewardOptions | null>(null);
  lossRewardOutcome = signal<LossRewardResultMessage | null>(null);
  lossRewardChoiceSending = signal(false);
  battleReplayId = signal<string | null>(null);
  battleStats = signal<FightStatsMessage | null>(null);
  gameOverVisible = signal(false);
  gameOverMessage = signal('');
  gameOverMinimized = signal(false);
  countdownText = signal<string | null>(null);
  fightSpeed = signal(1);
  readonly fightSpeeds = FightService.ALLOWED_FIGHT_SPEEDS;
  readonly fightSpeedHint = fightSpeedHint;
  burnCountdownMs = signal(END_BURN_START_MS);
  burnActive = signal(false);
  burnDamage = signal(0);
  roundWinWins = signal(0);
  readonly winsToWin = WINS_TO_WIN;

  constructor(
    private fightService: FightService,
    private draftService: DraftService,
    private snackBar: MatSnackBar,
    private router: Router,
    private route: ActivatedRoute,
    private runRegistry: RunRegistryService,
    private runResumeService: RunResumeService,
    private itemTrackingService: ItemTrackingService,
    private soundsService: SoundsService,
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) private platformId: Object,
    private fightAnimationService: FightAnimationService,
    private infoBoxService: InfoBoxService,
    private panelLayoutService: PanelLayoutService,
    private dialog: MatDialog,
    private replaysService: ReplaysService,
  ) {
    effect(() => {
      const room = this.fightService.room();
      if (room) {
        if (room.state?.player) {
          this.player.set(coercePlayer(room.state.player));
          this.enemy.set(coercePlayer(room.state.enemy));
        }

        room.onStateChange((state) => {
          this.player.set(coercePlayer(state.player));
          this.enemy.set(coercePlayer(state.enemy));
          this.fightSpeed.set(state.timeScale ?? 1);
          this.burnCountdownMs.set(state.endBurnCountdownMs ?? END_BURN_START_MS);
          this.burnActive.set(state.endBurnActive ?? false);
          this.burnDamage.set(state.endBurnDamage ?? 0);
        });

        const animCtx: AnimationContext = {
          renderer: this.renderer,
          platformId: this.platformId,
          player: this.player,
          enemy: this.enemy,
          entries: this.entries,
          triggerAttack: (id) => this.triggerAttack(id),
          triggerDamagedAvatar: (id) => this.triggerDamagedAvatarImage(id),
          onEndBattle: (msg) => {
            const result = msg?.result ?? 'win';
            const lossReward = msg?.lossReward ?? null;
            const replayId = msg?.replayId ?? null;
            const stats = msg?.stats ?? null;
            const wins = msg?.wins ?? this.player()?.wins ?? 0;
            this.battleOver = true;
            if (replayId) this.replaysService.invalidate(this.player()?.originalPlayerId ?? 0);
            this.runRegistry.setBattleEndState(this.runPlayerId, { type: 'end_battle', result, lossReward, replayId, stats, wins });
            if (result === 'win') this.soundsService.playSound(SoundOptions.CHEER);
            else if (result === 'lose') this.soundsService.playSound(SoundOptions.JEER);
            this.lossRewardOptions.set(lossReward);
            this.lossRewardOutcome.set(lossReward?.outcome ?? null);
            this.lossRewardChoiceSending.set(false);
            this.battleReplayId.set(replayId);
            this.battleStats.set(stats);
            this.battleResult.set(result);
            if (result === 'win') this.roundWinWins.set(wins);
            this.battleResultMinimized.set(false);
            this.battleResultVisible.set(true);
            this.infoBoxService.setPageDefault(
              result === 'win' ? battleWonHint : result === 'lose' ? battleLostHint : battleDrawHint
            );
          },
          onGameOver: (message) => {
            const msg: GameOverMessage = typeof message === 'string' ? { message } : message;
            this.gameOver = true;
            this.battleOver = true;
            this.gameOverMessage.set(msg.message);
            this.gameOverMinimized.set(false);
            this.gameOverVisible.set(true);
            this.battleReplayId.set(msg.replayId ?? null);
            this.battleStats.set(msg.stats ?? null);
            if (msg.replayId) this.replaysService.invalidate(this.player()?.originalPlayerId ?? 0);
            this.runRegistry.setBattleEndState(this.runPlayerId, { type: 'game_over', message: msg.message, replayId: msg.replayId, stats: msg.stats });
            this.runRegistry.markEnded(this.runPlayerId);
            this.infoBoxService.setPageDefault(runOverHint);
          },
          onGameWin: (message) => {
            this.soundsService.playSound(SoundOptions.CHEER);
            triggerCelebrationFireworks(this.renderer, this.platformId, 7,
              () => this.soundsService.playSound(SoundOptions.FIREWORK));
            this.gameWin.set(true);
            this.gameWinMinimized.set(false);
            this.gameWinWins.set(message.wins);
            this.gameWinLosses.set(message.losses ?? 0);
            this.gameOver = true;
            this.battleOver = true;
            this.battleReplayId.set(message.replayId ?? null);
            this.battleStats.set(message.stats ?? null);
            if (message.replayId) this.replaysService.invalidate(this.player()?.originalPlayerId ?? 0);
            this.runRegistry.setBattleEndState(this.runPlayerId, { type: 'game_win', wins: message.wins, losses: message.losses, replayId: message.replayId, stats: message.stats });
            this.runRegistry.markEnded(this.runPlayerId);
            this.infoBoxService.setPageDefault(gameWinHint);
          },
        };

        room.onMessage('combat_log', (msg: CombatLogEntry) => {
          this.fightAnimationService.applyCombatLog(animCtx, msg);
          if (msg.kind === 'countdown') {
            const n = msg.text.match(/\d+/)?.[0];
            if (n) this.countdownText.set(n);
          } else if (msg.kind === 'fight_start') {
            this.countdownText.set('Fight!');
            setTimeout(() => this.countdownText.set(null), 800);
          }
        });

        room.onMessage('attack', (message: number) => {
          this.fightAnimationService.applyAttack(animCtx, message);
        });

        room.onMessage('damage', (message: DamageMessage) => {
          this.fightAnimationService.applyDamage(animCtx, message);
        });

        room.onMessage('healing', (message: HealingMessage) => {
          this.fightAnimationService.applyHealing(animCtx, message);
        });

        room.onMessage('reward_gain', (message: RewardGainMessage) => {
          this.fightAnimationService.applyReward(animCtx, message);
        });

        room.onMessage('invulnerable', (message: InvulnerableMessage) => {
          this.fightAnimationService.applyInvulnerable(animCtx, message);
        });

        // Live mode gets `invincible` via schema sync — the state message only
        // exists for replays, but an unregistered type would log a warning.
        room.onMessage('invulnerable_state', () => {});

        // Live mode gets `stunned` via schema sync — same reasoning as invulnerable_state above.
        room.onMessage('stunned_state', () => {});

        room.onMessage('trigger_talent', (message: TriggerTalentMessage) => {
          this.fightAnimationService.applyTriggerTalent(animCtx, message);
        });

        room.onMessage('trigger_item', (message: TriggerItemMessage) => {
          this.fightAnimationService.applyTriggerItem(animCtx, message);
        });

        room.onMessage('game_over', (message: GameOverMessage | string) => {
          this.fightAnimationService.dispatch(animCtx, 'game_over', message);
        });

        room.onMessage('end_battle', (message: any) => {
          this.fightAnimationService.dispatch(animCtx, 'end_battle', message);
        });

        room.onMessage('loss_reward_result', (message: LossRewardResultMessage) => {
          this.lossRewardOutcome.set(message);
          this.lossRewardChoiceSending.set(false);
          // Re-persist so a refresh after choosing shows the outcome, not the choice.
          const state = this.runRegistry.getBattleEndState(this.runPlayerId) as any;
          if (state?.type === 'end_battle' && state.lossReward) {
            state.lossReward.outcome = message;
            this.runRegistry.setBattleEndState(this.runPlayerId, state);
          }
        });

        room.onMessage('game_win', (message: any) => {
          this.fightAnimationService.dispatch(animCtx, 'game_win', message);
        });

        // All handlers registered and initial state applied — safe to restore now.
        // untracked prevents this.player() read inside restoreBattleEndState from
        // being tracked by the effect, which would cause an infinite re-run loop.
        untracked(() => this.restoreBattleEndState());
      }
    });
  }

  async ngOnInit(): Promise<void> {
    this.fightSpeed.set(this.fightService.getStoredFightSpeed());
    this.soundsService.playMusic(MusicOptions.BATTLE);
    this.itemTrackingService.load(this.runPlayerId);
    const room = this.fightService.room();
    if (!room) {
      await this.runResumeService.resume(this.runPlayerId);
    }
  }

  setSpeed(speed: number): void {
    // Button highlight follows the server-synced timeScale via onStateChange.
    this.fightService.setFightSpeed(speed);
  }

  handleGameWinExit(): void {
    const player = this.player();
    if (!player) return;
    this.gameWin.set(false);
    this.endBattle(player.playerId, player.name, true, true);
  }

  selectLossReward(choice: LossRewardChoice): void {
    if (this.lossRewardOutcome() || this.lossRewardChoiceSending()) return;
    this.lossRewardChoiceSending.set(true);
    this.fightService.room()?.send('select_loss_reward', { choice });
  }

  rarityName(rarity: number): string {
    return ['', 'Common', 'Rare', 'Epic', 'Legendary', 'Mythic'][rarity] ?? `Rarity ${rarity}`;
  }

  lossChoicePending(): boolean {
    return this.battleResult() === 'lose' && !!this.lossRewardOptions() && !this.lossRewardOutcome();
  }

  handleBattleResultExit(): void {
    this.battleResultVisible.set(false);
    const p = this.player();
    if (p) this.endBattle(p.playerId, p.name, false, false);
  }

  openStats(): void {
    const stats = this.battleStats();
    if (!stats) return;
    this.dialog.open(FightStatsDialogComponent, {
      data: {
        playerName: this.player()?.name ?? 'You',
        enemyName: this.enemy()?.name ?? 'Enemy',
        stats,
      },
      backdropClass: 'chungus-dialog-backdrop',
      autoFocus: false,
    });
  }

  handleGameOverExit(): void {
    this.gameOverVisible.set(false);
    const p = this.player();
    if (p) this.endBattle(p.playerId, p.name, true, false);
  }

  private restoreBattleEndState(): void {
    const raw = this.runRegistry.getBattleEndState(this.runPlayerId);
    if (!raw) return;
    try {
      const state = raw as { type: string; message?: string; wins?: number; losses?: number; season?: number; result?: string; lossReward?: LossRewardOptions & { outcome?: LossRewardResultMessage }; replayId?: string | null; stats?: FightStatsMessage | null };
      const player = this.player();
      if (!player) return;
      if (state.type === 'game_over') {
        this.gameOver = true;
        this.battleOver = true;
        this.gameOverMessage.set(state.message ?? 'Game over');
        this.gameOverMinimized.set(false);
        this.gameOverVisible.set(true);
        this.battleReplayId.set(state.replayId ?? null);
        this.battleStats.set(state.stats ?? null);
        this.infoBoxService.setPageDefault(runOverHint);
      } else if (state.type === 'end_battle') {
        this.battleOver = true;
        this.lossRewardOptions.set(state.lossReward ?? null);
        this.lossRewardOutcome.set(state.lossReward?.outcome ?? null);
        this.lossRewardChoiceSending.set(false);
        this.battleReplayId.set(state.replayId ?? null);
        this.battleStats.set(state.stats ?? null);
        const result = (state.result as 'win' | 'lose' | 'draw') ?? 'win';
        this.battleResult.set(result);
        if (result === 'win') this.roundWinWins.set(state.wins ?? player.wins ?? 0);
        this.battleResultMinimized.set(false);
        this.battleResultVisible.set(true);
        this.infoBoxService.setPageDefault(
          result === 'win' ? battleWonHint : result === 'lose' ? battleLostHint : battleDrawHint
        );
      } else if (state.type === 'game_win' || state.type === 'version_win' || state.type === 'top_win') {
        // 'version_win'/'top_win' are legacy pre-Season-16 localStorage entries that may
        // survive a deploy across a page refresh — map them onto the new win screen too.
        this.gameOver = true;
        this.battleOver = true;
        this.gameWin.set(true);
        this.gameWinMinimized.set(false);
        this.gameWinWins.set(state.wins ?? 0);
        this.gameWinLosses.set(state.losses ?? 0);
        this.battleReplayId.set(state.replayId ?? null);
        this.battleStats.set(state.stats ?? null);
        this.infoBoxService.setPageDefault(gameWinHint);
      }
    } catch {}
  }

  async endBattle(playerId: number, name: string, gameOver = false, won = false) {
    this.runRegistry.setBattleEndState(playerId, null);
    this.battleReplayId.set(null);
    this.battleStats.set(null);
    // Awaited: resolves only once the server's onLeave (save + releasePlayerSession) completes,
    // so the draftService.joinRun below — now that the session-claim mutex is actually
    // enforced — doesn't race the still-live claim and get rejected with "already playing".
    await this.fightService.leave(false);
    this.soundsService.stopMusic();
    if (gameOver) {
      this.router.navigate(['/end', { won: won ? 'won' : 'lost', playerId }]);
    } else {
      const errorMessage = await this.draftService.joinRun(playerId);
      if (errorMessage) {
        this.snackBar.open('Could not rejoin the draft — please try again.', 'Dismiss', {
          duration: 6000,
          panelClass: 'chungus-snackbar',
        });
        // Both this fight and the draft join above have already ended/failed at this point —
        // staying on the fight screen just leaves a dead room signal and buttons that silently
        // do nothing. Send the player home, where the run list reflects the real state.
        this.router.navigate(['/']);
      }
    }
  }

  triggerDamagedAvatarImage(damagedPlayerId: number) {
    triggerAvatarHit(damagedPlayerId);
    if (damagedPlayerId === this.player()?.playerId) {
      this.playerBeingHit.set(true);
      setTimeout(() => this.playerBeingHit.set(false), 200);
    } else {
      this.enemyBeingHit.set(true);
      setTimeout(() => this.enemyBeingHit.set(false), 200);
    }
  }

  private lastAttackSoundTime = 0;
  private readonly ATTACK_SOUND_INTERVAL_MS = 125; // max ~8 sounds/sec

  triggerAttack(_attackerId: number) {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const now = performance.now();
    if (now - this.lastAttackSoundTime >= this.ATTACK_SOUND_INTERVAL_MS) {
      this.soundsService.playSound(SoundOptions.ATTACK);
      this.lastAttackSoundTime = now;
    }
  }

  resetPanelLayout(): void {
    this.panelLayoutService.reset();
  }

  formatBurnClock(ms: number): string {
    const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  winPips(): boolean[] {
    const wins = this.roundWinWins();
    return Array.from({ length: this.winsToWin }, (_, i) => i < wins);
  }

  burnProgressPercent(): number {
    if (this.burnActive()) return 100;
    const elapsed = END_BURN_START_MS - this.burnCountdownMs();
    return Math.min(100, Math.max(0, (elapsed / END_BURN_START_MS) * 100));
  }
}
