import { Component, effect } from '@angular/core';
import { FightService } from '../../services/fight.service';
import { CharacterSheetComponent } from '../../../draft/components/character-sheet/character-sheet.component';
import { Player } from '../../../models/colyseus-schema/PlayerSchema';
import { CombatLogComponent } from '../combat-log/combat-log.component';
import { DraftService } from '../../../draft/services/draft.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

@Component({
  selector: 'app-fight-room',
  standalone: true,
  imports: [CharacterSheetComponent, CombatLogComponent],
  templateUrl: './fight-room.component.html',
  styleUrl: './fight-room.component.css',
})
export class FightRoomComponent {
  player: Player | null = null;
  enemy: Player | null = null;
  combatLog: string = '';

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
          this.openSnackBar(
            message,
            'Exit',
            room.state.player.playerId,
            room.state.player.name,
            true
          );
        });

        room.onMessage('end_battle', (message: string) => {
          this.openSnackBar(
            'The battle has ended',
            'Exit',
            room.state.player.playerId,
            room.state.player.name
          );
        });

        room.onMessage('combat_log', (message: string) => {
          // Regular expression to match and replace decimal numbers
          const formattedMessage = message.replace(/(\d*\.\d+)/g, (match) => {
            console.log('match', match);
            // Use Number.toFixed(2) to format each matched number to 2 decimal places
            return Math.round(parseFloat(match)).toString();
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
      }
    });
  }

  openSnackBar(
    message: string,
    action: string,
    playerId: number,
    name: string,
    gameOver: boolean = false
  ) {
    const matSnackBarRef = this.snackBar.open(message, action);
    matSnackBarRef.onAction().subscribe(() => {
      this.endBattle(playerId, name, gameOver, message);
      matSnackBarRef.dismiss();
    });
  }

  async ngOnInit(): Promise<void> {
    const room = this.fightService.room();

    if (!room) {
      await this.fightService.reconnect(
        localStorage.getItem('reconnectToken') as string
      );
    }
  }

  private endBattle(
    plyerId: number,
    name: string,
    gameOver: boolean = false,
    message: string
  ) {
    this.fightService.leave(false);
    if (gameOver) {
      if (message.includes('won')) {
        this.router.navigate(['/end', { won: 'won' }]);
      } else {
        this.router.navigate(['/end', { won: 'lost' }]);
      }
    } else {
      this.draftService.joinOrCreate(name, plyerId);
    }
  }

  triggerShowHealingNumber(healing: number, playerId: number) {
    const healingNumbersContainer = document.getElementById(
      `damage-numbers-${playerId}`
    );
    const healingNumber = document.createElement('div');

    //avatarToHeal?.classList.add('animate-heal');
    healingNumber.classList.add('healing-number');
    healingNumber.textContent = `+${healing}`;
    healingNumber.style.left = `${Math.random() * 100}%`; // Random horizontal position

    if (healingNumbersContainer)
      healingNumbersContainer.appendChild(healingNumber);

    setTimeout(() => {
      healingNumber.remove();
    }, 3000);
  }

  triggerShowDamageNumber(damage: number, defenderId: number) {
    const damageNumbersContainer = document.getElementById(
      `damage-numbers-${defenderId}`
    );
    const damageNumber = document.createElement('div');

    //avatarToHit?.classList.add('animate-hit');
    damageNumber.classList.add('damage-number');
    damageNumber.textContent = `-${damage}`;
    damageNumber.style.left = `${Math.random() * 100}%`; // Random horizontal position

    if (damageNumbersContainer)
      damageNumbersContainer.appendChild(damageNumber);

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
      attack.src =
        'https://chungus-battles.b-cdn.net/chungus-battles-assets/Sword-2.png';
      const oldAttack = document.querySelector('.animate-attack');
      oldAttack?.remove();
    } else if (attackerId === this.enemy?.playerId) {
      attack.classList.add('animate-attack-enemy');
      attack.src =
        'https://chungus-battles.b-cdn.net/chungus-battles-assets/Sword-2-enemy.png';
      const oldAttack = document.querySelector('.animate-attack-enemy');
      oldAttack?.remove();
    }

    if (attackContainer) attackContainer.appendChild(attack);
  }
}

type DamageMessage = {
  playerId: number;
  damage: number;
};

type HealingMessage = {
  playerId: number;
  healing: number;
};
