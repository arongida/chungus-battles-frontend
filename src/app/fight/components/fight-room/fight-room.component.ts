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
  styleUrl: './fight-room.component.css'
})
export class FightRoomComponent {

  player: Player | null = null;
  enemy: Player | null = null;
  combatLog: string = "";

  constructor(private fightService: FightService, private draftService: DraftService, private snackBar: MatSnackBar, private router: Router) {
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

        room.onMessage("game_over", (message: string) => {
          this.openSnackBar(message, "Exit", room.state.player.playerId, room.state.player.name, true);
        })

        room.onMessage("end_battle", (message: string) => {
          this.openSnackBar("The battle has ended", "Exit", room.state.player.playerId, room.state.player.name);
        });

        room.onMessage("combat_log", (message: string) => {
          this.combatLog += message + "\n";
        });

        room.onMessage("damage", (message: DamageMessage) => {
          if (this.player && this.enemy) {
            if (this.player.playerId === message.defender) {
              this.triggerShowDamageNumber(message.damage, message.defender);
            } else if (this.enemy.playerId === message.defender) {
              this.triggerShowDamageNumber(message.damage, message.defender);
            }
          }
        });

      }
    });

  }

  openSnackBar(message: string, action: string, playerId: number, name: string, gameOver: boolean = false) {
    const matSnackBarRef = this.snackBar.open(message, action);
    matSnackBarRef.onAction().subscribe(() => {
      this.endBattle(playerId, name, gameOver, message);
      matSnackBarRef.dismiss();
    });
  }

  async ngOnInit(): Promise<void> {

    const room = this.fightService.room();

    if (!room) {
      await this.fightService.reconnect(localStorage.getItem('reconnectToken') as string);
    }
  }

  private endBattle(plyerId: number, name: string, gameOver: boolean = false, message: string) {
    this.fightService.leave(false);
    if (gameOver) {
      if (message.includes("won")) {
        this.router.navigate(['/end', { won: "won" }]);
      } else {
        this.router.navigate(['/end', { won: "lost" }]);
      }
    } else {
      this.draftService.joinOrCreate(name, plyerId);
    }
  }

  triggerShowDamageNumber(damage: number, defenderId: number) {
    const damageNumbersContainer = document.getElementById(`damage-numbers-${defenderId}`);
    const avatarToHit = document.getElementById(`avatar-${defenderId}`);
    const damageNumber = document.createElement('div');

    avatarToHit?.classList.add('animate-hit');
    damageNumber.classList.add('damage-number');
    damageNumber.textContent = `-${damage}`;
    damageNumber.style.left = `${Math.random() * 100}%`; // Random horizontal position

    if (damageNumbersContainer) damageNumbersContainer.appendChild(damageNumber);

    setTimeout(() => {
      avatarToHit?.classList.remove('animate-hit');
    }, 500);

    setTimeout(() => {
      damageNumber.remove();
    }, 3000);
  }

}

type DamageMessage = {
  attacker: string;
  defender: number;
  damage: number;
};
