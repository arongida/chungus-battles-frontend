import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Player } from '../models/colyseus-schema/PlayerSchema';
import { Item } from '../models/colyseus-schema/ItemSchema';
import { environment } from '../../environments/environment';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MapSchema } from '@colyseus/schema';
import { CharacterDetailsDialogComponent } from '../common/components/character-details-dialog/character-details-dialog.component';

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

  constructor(private router: Router, private route: ActivatedRoute, private dialog: MatDialog) {}

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
      const topPlayersUrl = `${environment.gameServer}/topPlayers?numberOfPlayers=10`;
      const topPlayerResults = await fetch(topPlayersUrl).then(res => res.json());
      console.log('Top players:', topPlayerResults);
      this.topPlayers = topPlayerResults;

      // Get player rank
      const playerRankUrl = `${environment.gameServer}/rank?playerId=${this.playerId}`;
      const playerRankResult = await fetch(playerRankUrl).then(res => res.json());
      this.playerRank = playerRankResult.rank;
      this.playerName = playerRankResult.name;
      this.playerWins = playerRankResult.wins;
    } catch (error) {
      console.error('Error fetching player data:', error);
    }
  }

  async viewPlayerBuild(playerId: number) {
    try {
      const data = await fetch(`${environment.gameServer}/playerBuild?playerId=${playerId}`).then(res => res.json());
      const player = this.buildPlayerFromData(data);
      this.dialog.open(CharacterDetailsDialogComponent, { data: { player } });
    } catch (error) {
      console.error('Error fetching player build:', error);
    }
  }

  private buildPlayerFromData(data: any): Player {
    const player = new Player();
    Object.assign(player, data);
    const equippedMap = new MapSchema<Item>();
    if (data.equippedItems) {
      Object.entries(data.equippedItems).forEach(([slot, itemData]) => {
        const item = new Item();
        Object.assign(item, itemData as any);
        equippedMap.set(slot, item);
      });
    }
    player.equippedItems = equippedMap;
    return player;
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
