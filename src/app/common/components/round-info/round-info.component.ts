import { Component, Input } from '@angular/core';
import { Player } from '../../../models/colyseus-schema/PlayerSchema';
import { InfoHintDirective } from '../../directives/info-hint.directive';
import { InfoContent } from '../../models/info-content';


@Component({
  selector: 'app-round-info',
  standalone: true,
  imports: [InfoHintDirective],
  templateUrl: './round-info.component.html',
  styleUrl: './round-info.component.scss'
})
export class RoundInfoComponent {

  @Input({ required: true }) player: Player = {} as Player;

  get roundInfoHint(): InfoContent {
    return {
      title: 'Game Status',
      entries: [
        { icon: '🔄', label: 'Round', text: `You are on round ${this.player.round}. You will be matched against players of a similar round in battle.` },
        { icon: '❤️', label: 'Lives', text: `You have ${this.player.lives} ${this.player.lives === 1 ? 'life' : 'lives'} remaining. Losing a battle costs 1 life — run ends at zero.` },
        { icon: '🏆', label: 'Wins', text: `${this.getPlayerWins()} ${this.getPlayerWins() === 1 ? 'battle won' : 'battles won'} so far. Keep winning to climb the leaderboard!` },
      ],
    };
  }

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
