import { Component, effect } from '@angular/core';
import { FightService } from '../../services/fight.service';
import { Player } from '../../../models/colyseus-schema/PlayerSchema';
import {
  HealingMessage,
  DamageMessage,
  TriggerTalentMessage,
  TriggerCollectionMessage,
} from '../../../models/message-types/MessageTypes';
import { CombatLogComponent } from '../combat-log/combat-log.component';
import { DraftService } from '../../../draft/services/draft.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';
import { triggerTalentActivation, triggerItemCollectionActivation } from '../../../common/TriggerAnimations';
import { RoundInfoComponent } from '../../../common/components/round-info/round-info.component';
import { CharacterDetailsComponent } from '../../../common/components/character-details/character-details.component';
import { SkillIconsComponent } from '../../../common/components/skill-icons/skill-icons.component';
import { DraftToolbarComponent } from '../../../common/components/draft-toolbar/draft-toolbar.component';

@Component({
  selector: 'app-fight-room',
  standalone: true,
  imports: [
    DraftToolbarComponent,
    CombatLogComponent,
    MatTooltipModule,
    RoundInfoComponent,
    CharacterDetailsComponent,
    SkillIconsComponent,
  ],
  templateUrl: './fight-room.component.html',
  styleUrl: './fight-room.component.scss',
})
export class FightRoomComponent {
  player: Player | null = null;
  enemy: Player | null = null;
  combatLog: string = '';
  gameOver: boolean = false;
  battleOver: boolean = false;
  leaveLoading: boolean = false;

  constructor(
    private fightService: FightService,
    private draftService: DraftService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    effect(() => {
      const room = this.fightService.room();
      if (room) {
        room.onStateChange((state) => {
          // Assuming state.player is a plain object
          const plainPlayerObject = state.player;
          const plainEnemyObject = state.enemy;

          // Create a new Player instance
          const player = new Player();
          const enemy = new Player();

          // Copy properties from the plain object to the new Player instance
          Object.assign(player, plainPlayerObject);
          Object.assign(enemy, plainEnemyObject);

          // Assign the Player instance to this.player
          this.player = player;
          this.enemy = enemy;
        });

        room.onMessage('game_over', (message: string) => {
          this.openSnackBar(message, 'Exit', room.state.player.playerId, room.state.player.name, true);
          this.gameOver = true;
          this.battleOver = true;
        });

        room.onMessage('end_battle', (message: string) => {
          this.openSnackBar('The battle has ended', 'Exit', room.state.player.playerId, room.state.player.name);
          this.battleOver = true;
        });

        room.onMessage('combat_log', (message: string) => {
          // Regular expression to match and replace decimal numbers
          const formattedMessage = message.replace(/(\d*\.\d+)/g, (match) => {
            console.log('match', match);
            // Use Number.toFixed(2) to format each matched number to 2 decimal places
            return parseFloat(match).toFixed(2);
          });

          this.combatLog += formattedMessage + '\n';
        });

        room.onMessage('attack', (message: number) => {
          if (this.player && this.enemy) {
            this.triggerAttack(message);
          }
        });

        room.onMessage('damage', (message: DamageMessage) => {
          if (this.player && this.enemy) {
            const roundedDamage = Math.round(message.damage);
            this.triggerShowDamageNumber(roundedDamage, message.playerId);
          }
        });

        room.onMessage('healing', (message: HealingMessage) => {
          if (this.player && this.enemy) {
            const roundedHealing = Math.round(message.healing);
            this.triggerShowHealingNumber(roundedHealing, message.playerId);
          }
        });

        room.onMessage('trigger_talent', (message: TriggerTalentMessage) => {
          if (this.player && this.enemy) {
            triggerTalentActivation(message.talentId, message.playerId);
            console.log('trigger_talent', message);
          }
        });

        room.onMessage('trigger_collection', (message: TriggerCollectionMessage) => {
          if (this.player && this.enemy) {
            triggerItemCollectionActivation(message.collectionId, message.playerId);
            console.log('trigger_collection', message);
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
    const room = this.fightService.room();

    if (!room) {
      await this.fightService.reconnect(localStorage.getItem('reconnectToken') as string);
    }
  }

  private async endBattle(plyerId: number, name: string, gameOver: boolean = false, message: string) {
    this.fightService.leave(false);
    if (gameOver) {
      if (message.includes('won')) {
        this.router.navigate(['/end', { won: 'won' }]);
      } else {
        this.router.navigate(['/end', { won: 'lost' }]);
      }
    } else {
      const errorMessage = await this.draftService.joinOrCreate(name, plyerId);
      if (errorMessage) {
        if (this.gameOver) {
          this.openSnackBar(message, 'Exit', this.player?.playerId ?? 0, this.player?.name ?? '', true);
        } else {
          this.openSnackBar('The battle has ended', 'Exit', this.player?.playerId ?? 0, this.player?.name ?? '');
        }
      }
    }
  }

  triggerShowHealingNumber(healing: number, playerId: number) {
    const healingNumbersContainer = document.getElementById(`damage-numbers-${playerId}`);
    const healingNumber = document.createElement('div');

    //avatarToHeal?.classList.add('animate-heal');
    healingNumber.classList.add('healing-number');
    healingNumber.textContent = `+${healing}`;
    healingNumber.style.left = `${Math.random() * 100}%`; // Random horizontal position

    if (healingNumbersContainer) healingNumbersContainer.appendChild(healingNumber);

    setTimeout(() => {
      healingNumber.remove();
    }, 3000);
  }

  triggerShowDamageNumber(damage: number, defenderId: number) {
    const damageNumbersContainer = document.getElementById(`damage-numbers-${defenderId}`);
    const damageNumber = document.createElement('div');

    //avatarToHit?.classList.add('animate-hit');
    damageNumber.classList.add('damage-number');
    damageNumber.textContent = `-${damage}`;
    damageNumber.style.left = `${Math.random() * 100}%`; // Random horizontal position

    if (damageNumbersContainer) damageNumbersContainer.appendChild(damageNumber);

    setTimeout(() => {
      damageNumber.remove();
    }, 3000);
  }


  triggerAttack(attackerId: number) {
    const attackContainer = document.getElementById(`attack-${attackerId}`);

    const attack = document.createElement('img');
    attack.style.scale = '0.5';

    if (attackerId === this.player?.playerId) {
      attack.classList.add('animate-attack');
      attack.src = 'https://chungus-battles.b-cdn.net/chungus-battles-assets/Sword-2.png';
      const oldAttack = document.querySelector('.animate-attack');
      oldAttack?.remove();
    } else if (attackerId === this.enemy?.playerId) {
      attack.classList.add('animate-attack-enemy');
      attack.src = 'https://chungus-battles.b-cdn.net/chungus-battles-assets/Sword-2-enemy.png';
      const oldAttack = document.querySelector('.animate-attack-enemy');
      oldAttack?.remove();
    }

    if (attackContainer) attackContainer.appendChild(attack);
  }
}
