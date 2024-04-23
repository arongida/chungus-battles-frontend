import { Component, effect } from '@angular/core';
import { FightService } from '../../services/fight.service';

@Component({
  selector: 'app-combat-log',
  standalone: true,
  imports: [],
  templateUrl: './combat-log.component.html',
  styleUrl: './combat-log.component.css'
})
export class CombatLogComponent {
  combatLog: string = "";

  roomSignal = this.fightService.room;

  constructor(private fightService: FightService) {
    effect(() => {
      const room = this.roomSignal();
      if (room) {
        room.onMessage("combat_log", (message: string) => {
          this.combatLog += message + "\n";
        });
      }
    });
   }
}
