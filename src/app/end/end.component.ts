import { Component, OnDestroy } from '@angular/core';
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
export class EndComponent implements OnDestroy {
  message: string = 'Game Over';
  topPlayers: Player[] = [];
  playerId: number = 0;
  playerRank: number = 0;
  playerName: string = '';
  playerWins: number = 0;

  private intervalId: any;

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    this.playerId = Number(localStorage.getItem('playerId')) ?? 0;

    this.fetchPlayerData();

    this.intervalId = setInterval(() => {
      this.fetchPlayerData();
    }, 5000);
  }

  async fetchPlayerData() {
    try {
      // Get top players
      const topPlayersUrl = `${environment.expressServer}/topPlayers?numberOfPlayers=10`;
      const topPlayerResults = await fetch(topPlayersUrl).then(res => res.json());
      console.log('Top players:', topPlayerResults);
      this.topPlayers = topPlayerResults;

      // Get player rank
      const playerRankUrl = `${environment.expressServer}/rank?playerId=${this.playerId}`;
      const playerRankResult = await fetch(playerRankUrl).then(res => res.json());
      this.playerRank = playerRankResult.rank;
      this.playerName = playerRankResult.name;
      this.playerWins = playerRankResult.wins;
    } catch (error) {
      console.error('Error fetching player data:', error);
    }
  }

  goToHome() {
    localStorage.removeItem('sessionId');
    localStorage.removeItem('playerId');
    localStorage.removeItem('roomId');
    localStorage.removeItem('reconnectToken');
    this.router.navigate(['/']);
  }

  topListContainsPlayer() {
    return this.topPlayers.some(player => player.playerId === this.playerId);
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}
