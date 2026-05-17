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
  TriggerTalentMessage,
  TriggerCollectionMessage,
  TriggerItemMessage,
  VersionWinMessage,
  EndBattleMessage,
} from '../../../models/types/MessageTypes';
import { CombatLogEntry } from '../../../models/types/CombatLogEntry';
import { CombatLogComponent } from '../combat-log/combat-log.component';
import { DraftService } from '../../../draft/services/draft.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { triggerTalentActivation, triggerAvatarHit, triggerItemActivation, triggerShowDamageNumber, triggerShowHealingNumber, triggerHpDamageFlash, triggerHpHealFlash } from '../../../common/TriggerAnimations';
import { RoundInfoComponent } from '../../../common/components/round-info/round-info.component';
import { CharacterDetailsComponent } from '../../../common/components/character-details/character-details.component';
import { SkillIconsComponent } from '../../../common/components/skill-icons/skill-icons.component';
import { DraftToolbarComponent } from '../../../common/components/draft-toolbar/draft-toolbar.component';
import { MusicOptions, SoundOptions, SoundsService } from '../../../common/services/sounds.service';

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
  ],
  templateUrl: './fight-room.component.html',
  styleUrl: './fight-room.component.scss',
})
export class FightRoomComponent implements OnInit {
  player = signal<Player | null>(null, { equal: () => false });
  enemy = signal<Player | null>(null, { equal: () => false });
  entries = signal<CombatLogEntry[]>([]);
  gameOver = false;
  battleOver = false;
  playerBeingHit = signal(false);
  enemyBeingHit = signal(false);
  versionWin = signal(false);
  versionWins = signal(0);
  topWin = signal(false);
  battleResultVisible = signal(false);
  battleResult = signal<'win' | 'lose' | 'draw'>('win');
  battleResultMinimized = signal(false);
  gameOverVisible = signal(false);
  gameOverMessage = signal('');
  gameOverMinimized = signal(false);

  // Set true by handleVersionWinContinue so the server's follow-up end_battle
  // navigates directly to draft without showing the battle result modal.
  private suppressNextBattleResult = false;

  constructor(
    private fightService: FightService,
    private draftService: DraftService,
    private snackBar: MatSnackBar,
    private router: Router,
    private soundsService: SoundsService,
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) private platformId: Object
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
        });

        room.onMessage('game_over', (message: string) => {
          this.gameOver = true;
          this.battleOver = true;
          if (message.includes('#1')) {
            this.topWin.set(true);
            localStorage.setItem('battleEndState', JSON.stringify({ type: 'top_win', message }));
          } else {
            this.gameOverMessage.set(message);
            this.gameOverMinimized.set(false);
            this.gameOverVisible.set(true);
            localStorage.setItem('battleEndState', JSON.stringify({ type: 'game_over', message }));
          }
        });

        room.onMessage('end_battle', (message: EndBattleMessage) => {
          const result = message?.result ?? 'win';

          this.battleOver = true;
          this.versionWin.set(false);
          localStorage.setItem('battleEndState', JSON.stringify({ type: 'end_battle', result }));

          if (this.suppressNextBattleResult) {
            this.suppressNextBattleResult = false;
            const p = this.player();
            if (p) this.endBattle(p.playerId, p.name, false, false);
            return;
          }

          this.battleResult.set(result);
          this.battleResultMinimized.set(false);
          this.battleResultVisible.set(true);
        });

        room.onMessage('version_win', (message: VersionWinMessage) => {
          this.versionWin.set(true);
          this.versionWins.set(message.wins);
          this.battleOver = true;
          localStorage.setItem('battleEndState', JSON.stringify({ type: 'version_win', wins: message.wins }));
        });

        room.onMessage('combat_log', (msg: CombatLogEntry) => {
          this.entries.update(prev => {
            const next = [...prev, msg];
            return next.length > 200 ? next.slice(-200) : next;
          });
        });

        room.onMessage('attack', (message: number) => {
          if (this.player() && this.enemy()) {
            this.triggerAttack(message);
          }
        });

        room.onMessage('damage', (message: DamageMessage) => {
          if (this.player() && this.enemy()) {
            triggerShowDamageNumber(this.renderer, this.platformId, Math.round(message.damage), message.playerId);
            triggerHpDamageFlash(message.playerId);
            this.triggerDamagedAvatarImage(message.playerId);
          }
        });

        room.onMessage('healing', (message: HealingMessage) => {
          if (this.player() && this.enemy()) {
            triggerShowHealingNumber(this.renderer, this.platformId, Math.round(message.healing), message.playerId);
            triggerHpHealFlash(message.playerId);
          }
        });

        room.onMessage('trigger_talent', (message: TriggerTalentMessage) => {
          if (this.player() && this.enemy()) {
            triggerTalentActivation(message.talentId, message.playerId);
          }
        });

        room.onMessage('trigger_item', (message: TriggerItemMessage) => {
          if (this.player() && this.enemy()) {
            triggerItemActivation(message.playerId, message.slot);
          }
        });

        // All handlers registered and initial state applied — safe to restore now.
        // untracked prevents this.player() read inside restoreBattleEndState from
        // being tracked by the effect, which would cause an infinite re-run loop.
        untracked(() => this.restoreBattleEndState());
      }
    });
  }

  async ngOnInit(): Promise<void> {
    this.soundsService.playMusic(MusicOptions.BATTLE);
    const room = this.fightService.room();
    if (!room) {
      await this.fightService.reconnect(localStorage.getItem('reconnectToken') as string);
    }
  }

  handleVersionWinContinue(): void {
    const room = this.fightService.room();
    if (room) room.send('continue_run');
    this.suppressNextBattleResult = true;
    this.versionWin.set(false);
  }

  handleVersionWinAccept(): void {
    const room = this.fightService.room();
    if (room) room.send('accept_win');
    this.versionWin.set(false);
    const p = this.player();
    if (p) this.endBattle(p.playerId, p.name, true, true);
  }

  handleTopWinExit(): void {
    const player = this.player();
    if (!player) return;
    this.topWin.set(false);
    this.endBattle(player.playerId, player.name, true, true);
  }

  handleBattleResultExit(): void {
    this.battleResultVisible.set(false);
    const p = this.player();
    if (p) this.endBattle(p.playerId, p.name, false, false);
  }

  handleGameOverExit(): void {
    this.gameOverVisible.set(false);
    const p = this.player();
    if (p) this.endBattle(p.playerId, p.name, true, false);
  }

  private restoreBattleEndState(): void {
    const raw = localStorage.getItem('battleEndState');
    if (!raw) return;
    try {
      const state = JSON.parse(raw) as { type: string; message?: string; wins?: number; result?: string };
      const player = this.player();
      if (!player) return;
      if (state.type === 'game_over') {
        this.gameOver = true;
        this.battleOver = true;
        this.gameOverMessage.set(state.message ?? 'Game over');
        this.gameOverMinimized.set(false);
        this.gameOverVisible.set(true);
      } else if (state.type === 'end_battle') {
        this.battleOver = true;
        this.battleResult.set((state.result as 'win' | 'lose' | 'draw') ?? 'win');
        this.battleResultMinimized.set(false);
        this.battleResultVisible.set(true);
      } else if (state.type === 'version_win') {
        this.battleOver = true;
        this.versionWin.set(true);
        this.versionWins.set(state.wins ?? 0);
      } else if (state.type === 'top_win') {
        this.gameOver = true;
        this.battleOver = true;
        this.topWin.set(true);
      }
    } catch {}
  }

  async endBattle(playerId: number, name: string, gameOver = false, won = false) {
    localStorage.removeItem('battleEndState');
    this.fightService.leave(false);
    this.soundsService.stopMusic();
    if (gameOver) {
      this.router.navigate(['/end', { won: won ? 'won' : 'lost' }]);
    } else {
      const errorMessage = await this.draftService.joinOrCreate(name, playerId);
      if (errorMessage) {
        this.snackBar.open('Could not rejoin draft — please try again.', 'Dismiss', {
          duration: 6000,
          panelClass: 'chungus-snackbar',
        });
      }
    }
  }

  triggerDamagedAvatarImage(damagedPlayerId: number) {
    triggerAvatarHit(damagedPlayerId);
    if (damagedPlayerId === Number(localStorage.getItem("playerId"))) {
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
}
