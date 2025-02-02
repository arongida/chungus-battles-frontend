import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Player } from '../models/colyseus-schema/PlayerSchema';
import { environment } from '../../environments/environment';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-end',
  standalone: true,
  imports: [MatButtonModule],
  templateUrl: './end.component.html',
  styleUrl: './end.component.scss',
})
export class EndComponent {
  message: string = 'Game Over';
  topPlayers: Player[] = [];
  playerId: number = 0;
  playerRank: number = 0;
  playerName: string = '';
  playerWins: number = 0;

  constructor(private router: Router, private route: ActivatedRoute) {}

  async ngOnInit() {
    //get top players
    const topPlayersUrl = `${environment.expressServer}/topPlayers?numberOfPlayers=10`;
    const topPlayerResults = await fetch(topPlayersUrl)
      .then((res) => res.json())
      .catch((e) => console.error(e));
    console.log('result: ', topPlayerResults);
    this.topPlayers = topPlayerResults;

    //get your rank
    this.playerId = Number(localStorage.getItem('playerId')) ?? 0;
    const playerRankUrl = `${environment.expressServer}/rank?playerId=${this.playerId}`;
    const playerRankResult = await fetch(playerRankUrl)
      .then((res) => res.json())
      .catch((e) => console.error(e));
    console.log('result: ', playerRankResult);
    this.playerRank = playerRankResult.rank;
    this.playerName = playerRankResult.name;
    this.playerWins = playerRankResult.wins;
  }

  public goToHome() {
    localStorage.removeItem('sessionId');
    localStorage.removeItem('playerId');
    localStorage.removeItem('roomId');
    localStorage.removeItem('reconnectToken');
    this.router.navigate(['/']);
  }
}
