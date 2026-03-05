import {
  Component,
  effect,
  Inject,
  OnInit,
  PLATFORM_ID,
  Renderer2,
  signal,
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
import { triggerTalentActivation, triggerItemCollectionActivation, triggerWeaponAttack, triggerAvatarHit, triggerItemActivation } from '../../../common/TriggerAnimations';
import { RoundInfoComponent } from '../../../common/components/round-info/round-info.component';
import { CharacterDetailsComponent } from '../../../common/components/character-details/character-details.component';
import { SkillIconsComponent } from '../../../common/components/skill-icons/skill-icons.component';
import { DraftToolbarComponent } from '../../../common/components/draft-toolbar/draft-toolbar.component';
import { MusicOptions, SoundOptions, SoundsService } from '../../../common/services/sounds.service';
import { EquipSlot } from '../../../models/types/ItemTypes';

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
  player = signal<Player | null>(null);
  enemy = signal<Player | null>(null);
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
    private renderer: Renderer2, // Inject Renderer2
    @Inject(PLATFORM_ID) private platformId: Object // Inject PLATFORM_ID
  ) {
    effect(() => {
      const room = this.fightService.room();
      if (room) {
        room.onStateChange((state) => {
          const player = new Player();
          const enemy = new Player();
          Object.assign(player, state.player);
          Object.assign(enemy, state.enemy);
          this.player.set(player);
          this.enemy.set(enemy);
        });

        room.onMessage('game_over', (message: string) => {
          this.openSnackBar(message, 'Exit', room.state.player.playerId, room.state.player.name, true);
          this.gameOver = true;
          this.battleOver = true;
        });

        room.onMessage('end_battle', () => {
          this.openSnackBar('The battle has ended', 'Exit', room.state.player.playerId, room.state.player.name);
          this.battleOver = true;
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

        room.onMessage('trigger_collection', (message: TriggerCollectionMessage) => {
          if (this.player() && this.enemy()) {
            triggerItemCollectionActivation(message.collectionId, message.playerId);
          }
        });

        room.onMessage('trigger_item', (message: TriggerItemMessage) => {
          if (this.player() && this.enemy()) {
            triggerItemActivation(message.playerId, message.slot);
          }
        });
      }
    });
  }

  openSnackBar(message: string, action: string, playerId: number, name: string, gameOver: boolean = false) {
    const matSnackBarRef = this.snackBar.open(message, action);
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
  }

  private async endBattle(playerId: number, name: string, gameOver: boolean = false, message: string) {
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

  triggerAttack(attackerId: number) {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.soundsService.playSound(SoundOptions.ATTACK);
    triggerWeaponAttack(attackerId, EquipSlot.MAIN_HAND);
  }
}
