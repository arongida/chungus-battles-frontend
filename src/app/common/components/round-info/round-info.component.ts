import { Component, Input } from '@angular/core';
import { Player } from '../../../models/colyseus-schema/PlayerSchema';
import { MatTooltipModule } from '@angular/material/tooltip';


@Component({
  selector: 'app-round-info',
  standalone: true,
  imports: [MatTooltipModule],
  templateUrl: './round-info.component.html',
  styleUrl: './round-info.component.scss'
})
export class RoundInfoComponent {
  
  @Input({ required: true }) player: Player = {} as Player;
  
  getLivesString(): string {
    let lives = '';
    if (this.player) {
      for (let i = 0; i < this.player.lives; i++) {
        lives += '❤️ ';
      }
    }
    return lives;
  }

  getPlayerWins(): number {
    return this.player?.wins || 0;
  }
}
