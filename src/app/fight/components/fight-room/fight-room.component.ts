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

  constructor(private fightService: FightService, private draftService: DraftService, private snackBar: MatSnackBar, private router: Router) {
    effect(() => {
      const room = this.fightService.room();
      if (room) {
        console.log("room from fight room", room);
        room.onStateChange((state) => {
          this.player = state.player as Player;
          this.enemy = state.enemy as Player;
          console.log("player state", this.player);
          console.log("enemy state", this.enemy);
        });



        room.onMessage("game_over", (message: string) => {

          this.openSnackBar(message, "Exit", room.state.player.playerId, room.state.player.name, true);
        })

        room.onMessage("end_battle", (message: string) => {
          this.openSnackBar("The battle has ended", "Exit", room.state.player.playerId, room.state.player.name);
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

}
