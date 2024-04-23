import { Component } from '@angular/core';
import { FightService } from '../../services/fight.service';
import { CharacterSheetComponent } from '../../../draft/components/character-sheet/character-sheet.component';
import { Player } from '../../../models/colyseus-schema/PlayerSchema';

@Component({
  selector: 'app-fight-room',
  standalone: true,
  imports: [CharacterSheetComponent],
  templateUrl: './fight-room.component.html',
  styleUrl: './fight-room.component.css'
})
export class FightRoomComponent {

  player?: Player;
  enemy?: Player;

  constructor(private fightService: FightService) {}

  async ngOnInit(): Promise<void> {

    if (!this.fightService.room) {
      await this.fightService.reconnect(localStorage.getItem('reconnectToken') as string);
    }

    this.fightService.room?.onStateChange((state) => {
      this.player = state.player as Player;
      this.enemy = state.enemy as Player;
      console.log("player state", this.player);
      console.log("enemy state", this.enemy);
    });
  }
}
