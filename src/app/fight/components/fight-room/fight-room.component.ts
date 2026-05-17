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
import { isPlatformBrowser } from '@angular/common'; // Import for platform check
import { FightService } from '../../services/fight.service';
import { Player } from '../../../models/colyseus-schema/PlayerSchema';
import {
  HealingMessage,
  DamageMessage,
  TriggerTalentMessage,
  TriggerCollectionMessage,
  TriggerItemMessage,
  VersionWinMessage,
} from '../../../models/types/MessageTypes';
import { CombatLogComponent } from '../combat-log/combat-log.component';
import { DraftService } from '../../../draft/services/draft.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { triggerTalentActivation, triggerAvatarHit, triggerItemActivation, triggerShowDamageNumber, triggerShowHealingNumber } from '../../../common/TriggerAnimations';
import { RoundInfoComponent } from '../../../common/components/round-info/round-info.component';
import { CharacterDetailsComponent } from '../../../common/components/character-details/character-details.component';
import { SkillIconsComponent } from '../../../common/components/skill-icons/skill-icons.component';
import { DraftToolbarComponent } from '../../../common/components/draft-toolbar/draft-toolbar.component';
import { MusicOptions, SoundOptions, SoundsService } from '../../../common/services/sounds.service';
import { InfoBoxService } from '../../../common/services/info-box.service';

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
    SkillIconsComponent,
  ],
  templateUrl: './fight-room.component.html',
  styleUrl: './fight-room.component.scss',
})
export class FightRoomComponent implements OnInit{
  player = signal<Player | null>(null, { equal: () => false });
  enemy = signal<Player | null>(null, { equal: () => false });
  combatLog = signal('');
  gameOver = false;
  battleOver = false;
  playerBeingHit = signal(false);
  enemyBeingHit = signal(false);
  versionWin = signal(false);
  versionWins = signal(0);
  topWin = signal(false);

  constructor(
    private fightService: FightService,
    private draftService: DraftService,
    private snackBar: MatSnackBar,
    private router: Router,
    private soundsService: SoundsService,
    private infoBoxService: InfoBoxService,
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
            this.openSnackBar(message, 'Exit', room.state.player.playerId, room.state.player.name, true);
            localStorage.setItem('battleEndState', JSON.stringify({ type: 'game_over', message }));
            this.showBattleOverInfo(true);
          }
        });

        room.onMessage('end_battle', () => {
          this.openSnackBar('The battle has ended', 'Exit', room.state.player.playerId, room.state.player.name);
          this.battleOver = true;
          this.versionWin.set(false);
          localStorage.setItem('battleEndState', JSON.stringify({ type: 'end_battle' }));
          this.showBattleOverInfo(false);
        });

        room.onMessage('version_win', (message: VersionWinMessage) => {
          this.versionWin.set(true);
          this.versionWins.set(message.wins);
          this.battleOver = true;
          localStorage.setItem('battleEndState', JSON.stringify({ type: 'version_win', wins: message.wins }));
        });

        room.onMessage('combat_log', (message: string) => {
          const formatted = message.replace(/(\d*\.\d+)/g, (match) => parseFloat(match).toFixed(2));
          this.combatLog.update(log => log + formatted + '\n');
        });

        room.onMessage('attack', (message: number) => {
          if (this.player() && this.enemy()) {
            this.triggerAttack(message);
          }
        });

        room.onMessage('damage', (message: DamageMessage) => {
          if (this.player() && this.enemy()) {
            triggerShowDamageNumber(this.renderer, this.platformId, Math.round(message.damage), message.playerId);
            this.triggerDamagedAvatarImage(message.playerId);
          }
        });

        room.onMessage('healing', (message: HealingMessage) => {
          if (this.player() && this.enemy()) {
            triggerShowHealingNumber(this.renderer, this.platformId, Math.round(message.healing), message.playerId);
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

  openSnackBar(message: string, action: string, playerId: number, name: string, gameOver: boolean = false) {
    const matSnackBarRef = this.snackBar.open(message, action, { panelClass: 'chungus-snackbar' });
    matSnackBarRef.onAction().subscribe(() => {
      this.endBattle(playerId, name, gameOver, message);
    });
  }

  async ngOnInit(): Promise<void> {
    this.soundsService.playMusic(MusicOptions.BATTLE);
    const room = this.fightService.room();
    if (!room) {
      await this.fightService.reconnect(localStorage.getItem('reconnectToken') as string);
    }
    // restoreBattleEndState is called inside the effect() after player state
    // and all handlers are registered, so this.player() is guaranteed non-null.
  }

  handleVersionWinContinue(): void {
    const room = this.fightService.room();
    if (room) room.send('continue_run');
    this.versionWin.set(false);
  }

  handleVersionWinAccept(): void {
    const room = this.fightService.room();
    if (room) room.send('accept_win');
    this.versionWin.set(false);
  }

  handleTopWinExit(): void {
    const player = this.player();
    if (!player) return;
    this.topWin.set(false);
    this.endBattle(player.playerId, player.name, true, 'YOU ARE THE #1 TOP CHUNGERION! CHUNGRATULATIONS!');
  }

  private restoreBattleEndState(): void {
    const raw = localStorage.getItem('battleEndState');
    if (!raw) return;
    try {
      const state = JSON.parse(raw) as { type: string; message?: string; wins?: number };
      const player = this.player();
      if (!player) return;
      if (state.type === 'game_over') {
        this.gameOver = true;
        this.battleOver = true;
        this.openSnackBar(state.message ?? 'Game over', 'Exit', player.playerId, player.name, true);
        this.showBattleOverInfo(true);
      } else if (state.type === 'end_battle') {
        this.battleOver = true;
        this.openSnackBar('The battle has ended', 'Exit', player.playerId, player.name);
        this.showBattleOverInfo(false);
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

  private showBattleOverInfo(gameOver: boolean): void {
    if (gameOver) {
      this.infoBoxService.setPageDefault({
        title: 'Game Over',
        entries: [{ icon: '🏆', label: 'Exit', text: 'The game has ended! Click Exit in the banner to see your results.' }],
      });
    } else {
      this.infoBoxService.setPageDefault({
        title: 'Battle Over',
        entries: [{ icon: '✅', label: 'Next Round', text: 'The battle is over! Click Exit in the banner to head back to the draft.' }],
      });
    }
  }

  async endBattle(playerId: number, name: string, gameOver: boolean = false, message: string) {
    localStorage.removeItem('battleEndState');
    this.fightService.leave(false);
    this.soundsService.stopMusic();
    if (gameOver) {
      if (message.includes('#1')) {
        this.router.navigate(['/end', { won: 'won' }]);
      } else {
        this.router.navigate(['/end', { won: 'lost' }]);
      }
    } else {
      const errorMessage = await this.draftService.joinOrCreate(name, playerId);
      if (errorMessage) {
        if (this.gameOver) {
          this.openSnackBar(message, 'Exit', this.player()?.playerId ?? 0, this.player()?.name ?? '', true);
        } else {
          this.openSnackBar('The battle has ended', 'Exit', this.player()?.playerId ?? 0, this.player()?.name ?? '');
        }
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
