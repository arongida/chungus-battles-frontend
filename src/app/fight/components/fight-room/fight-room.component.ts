import { Component, effect } from '@angular/core';
import { FightService } from '../../services/fight.service';
import { CharacterSheetComponent } from '../../../draft/components/character-sheet/character-sheet.component';
import { Player } from '../../../models/colyseus-schema/PlayerSchema';
import { CombatLogComponent } from '../combat-log/combat-log.component';

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
  room = this.fightService.room;

  constructor(private fightService: FightService) {
    effect(() => {
      const room = this.room();
      if (room) {
        console.log("room from fight room", room);
        room.onStateChange((state) => {
          this.player = state.player as Player;
          this.enemy = state.enemy as Player;
          console.log("player state", this.player);
          console.log("enemy state", this.enemy);
        });
      }
    });

  }

  async ngOnInit(): Promise<void> {

    const room = this.room();

    if (!room) {
      await this.fightService.reconnect(localStorage.getItem('reconnectToken') as string);
    }
  }
}
