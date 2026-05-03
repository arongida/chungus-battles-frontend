import {
  Component,
  effect,
  Inject,
  NgZone,
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
} from '../../../models/types/MessageTypes';
import { CombatLogComponent } from '../combat-log/combat-log.component';
import { DraftService } from '../../../draft/services/draft.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { triggerTalentActivation, triggerAvatarHit, triggerItemActivation } from '../../../common/TriggerAnimations';
import { RoundInfoComponent } from '../../../common/components/round-info/round-info.component';
import { CharacterDetailsComponent } from '../../../common/components/character-details/character-details.component';
import { SkillIconsComponent } from '../../../common/components/skill-icons/skill-icons.component';
import { DraftToolbarComponent } from '../../../common/components/draft-toolbar/draft-toolbar.component';
import { MusicOptions, SoundOptions, SoundsService } from '../../../common/services/sounds.service';
import { EquipSlot } from '../../../models/types/ItemTypes';
import { InfoBoxService } from '../../../common/services/info-box.service';

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

  constructor(
    private fightService: FightService,
    private draftService: DraftService,
    private snackBar: MatSnackBar,
    private router: Router,
    private soundsService: SoundsService,
    private infoBoxService: InfoBoxService,
    private renderer: Renderer2,
    private zone: NgZone,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    effect(() => {
      const room = this.fightService.room();
      if (room) {
        const applyPlayers = (state: typeof room.state) => {
          this.zone.run(() => {
            const player = new Player();
            const enemy = new Player();
            Object.assign(player, state.player);
            Object.assign(enemy, state.enemy);
            this.player.set(player);
            this.enemy.set(enemy);
          });
        };

        if (room.state?.player) {
          this.player.set(room.state.player);
          this.enemy.set(room.state.enemy);
        }

        room.onStateChange((state) => {
          this.player.set(state.player);
          this.enemy.set(state.enemy);
        });

        room.onMessage('game_over', (message: string) => {
          this.zone.run(() => {
            this.openSnackBar(message, 'Exit', room.state.player.playerId, room.state.player.name, true);
            this.gameOver = true;
            this.battleOver = true;
            localStorage.setItem('battleEndState', JSON.stringify({ type: 'game_over', message }));
            this.showBattleOverInfo(true);
          });
        });

        room.onMessage('end_battle', () => {
          this.zone.run(() => {
            this.openSnackBar('The battle has ended', 'Exit', room.state.player.playerId, room.state.player.name);
            this.battleOver = true;
            localStorage.setItem('battleEndState', JSON.stringify({ type: 'end_battle' }));
            this.showBattleOverInfo(false);
          });
        });

        room.onMessage('combat_log', (message: string) => {
          const formatted = message.replace(/(\d*\.\d+)/g, (match) => parseFloat(match).toFixed(2));
          this.zone.run(() => this.combatLog.update(log => log + formatted + '\n'));
        });

        room.onMessage('attack', (message: number) => {
          if (this.player() && this.enemy()) {
            this.triggerAttack(message);
          }
        });

        room.onMessage('damage', (message: DamageMessage) => {
          if (this.player() && this.enemy()) {
            this.triggerShowDamageNumber(Math.round(message.damage), message.playerId);
            this.triggerDamagedAvatarImage(message.playerId);
          }
        });

        room.onMessage('healing', (message: HealingMessage) => {
          if (this.player() && this.enemy()) {
            this.triggerShowHealingNumber(Math.round(message.healing), message.playerId);
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

  private restoreBattleEndState(): void {
    const raw = localStorage.getItem('battleEndState');
    if (!raw) return;
    try {
      const state = JSON.parse(raw) as { type: string; message?: string };
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

  private async endBattle(playerId: number, name: string, gameOver: boolean = false, message: string) {
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

  triggerShowHealingNumber(healing: number, playerId: number) {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const healingNumbersContainer = document.getElementById(`damage-numbers-${playerId}`);
    if (!healingNumbersContainer) {
      console.warn(`Healing container not found for playerId: ${playerId}`);
      return;
    }

    const healingNumber = this.renderer.createElement('div');
    this.renderer.addClass(healingNumber, 'healing-number');

    const textNode = this.renderer.createText(`+${healing}`);
    this.renderer.appendChild(healingNumber, textNode);

    this.renderer.setStyle(healingNumber, 'left', `${Math.random() * 100}%`);

    this.renderer.appendChild(healingNumbersContainer, healingNumber);

    setTimeout(() => {
      if (healingNumber.parentNode === healingNumbersContainer) {
        this.renderer.removeChild(healingNumbersContainer, healingNumber);
      }
    }, 3000);
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

  triggerShowDamageNumber(damage: number, defenderId: number) {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const damageNumbersContainer = document.getElementById(`damage-numbers-${defenderId}`);
    if (!damageNumbersContainer) {
      console.warn(`Damage container not found for defenderId: ${defenderId}`);
      return;
    }

    const damageNumber = this.renderer.createElement('div');
    this.renderer.addClass(damageNumber, 'damage-number');

    const textNode = this.renderer.createText(`-${damage}`);
    this.renderer.appendChild(damageNumber, textNode);

    this.renderer.setStyle(damageNumber, 'left', `${Math.random() * 100}%`);

    const minSize = 16;
    const scaleFactor = 0.5;
    this.renderer.setStyle(damageNumber, 'fontSize', `${minSize + damage * scaleFactor}px`);

    this.renderer.appendChild(damageNumbersContainer, damageNumber);

    setTimeout(() => {
      if (damageNumber.parentNode === damageNumbersContainer) { // Ensure it's still parented correctly
        this.renderer.removeChild(damageNumbersContainer, damageNumber);
      }
    }, 3000);
  }

  private lastAttackSoundTime = 0;
  private readonly ATTACK_SOUND_INTERVAL_MS = 125; // max ~8 sounds/sec

  triggerAttack(attackerId: number) {
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
