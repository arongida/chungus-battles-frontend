import { Injectable } from '@angular/core';
import * as Colyseus from 'colyseus.js';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';
import { DraftState } from '../../models/colyseus-schema/DraftState';
import { Player } from '../../models/colyseus-schema/PlayerSchema';

@Injectable({
  providedIn: 'root',
})
export class DraftService {
  client: Colyseus.Client;
  room: Colyseus.Room<DraftState> | undefined;
  player: Player | undefined;

  static isLocalStorageAvailable = typeof localStorage !== 'undefined';

  constructor(private router: Router) {
    this.client = new Colyseus.Client(environment.gameServer);
    //this.playerId = Math.floor(Math.random() * 1000);
    console.log('gameserver: ', this.client);
  }

  public async joinOrCreate(
    name?: string,
    playerIdInput?: number,
    avatarUrl?: string
  ): Promise<string | null> {
    try {
      let playerId = playerIdInput;
      if (!playerId) {
        const result = await fetch(environment.expressServer + '/playerId')
          .then((res) => res.json())
          .catch((e) => console.error(e));
        playerId = result.playerId;
      }

      this.room = await this.client.joinOrCreate('draft_room', {
        name: name,
        playerId: playerId,
        avatarUrl: avatarUrl,
      });

      this.room.onMessage('*', (type, message) => {
        console.log('message: ', type, message);
      });

      console.log('joined successfully', this.room);

      if (DraftService.isLocalStorageAvailable) {
        localStorage.setItem('sessionId', this.room.sessionId);
        localStorage.setItem('playerId', playerId!.toString());
        localStorage.setItem('roomId', this.room.roomId);
        localStorage.setItem('reconnectToken', this.room.reconnectionToken);
      }

      this.router.navigate(['/draft', this.room.sessionId]);
      return null;
    } catch (e) {
      console.error('join error', e);
      const message = e instanceof Error ? e.message : 'Unknown error.';
      return message;
    }
  }

  public async reconnect(reconnectionToken: string) {
    try {
      this.room = await this.client.reconnect(reconnectionToken);

      this.room.onMessage('*', (type, message) => {
        console.log('message: ', type, message);
      });

      console.log('reconnected', this.room);

      if (DraftService.isLocalStorageAvailable) {
        localStorage.setItem('sessionId', this.room.sessionId);
        localStorage.setItem('roomId', this.room.roomId);
        localStorage.setItem('reconnectToken', this.room.reconnectionToken);
      }

      this.router.navigate(['/draft', this.room.sessionId]);
    } catch (e) {
      console.error('reconnect error', e);
      this.router.navigate(['/']);
    }
  }

  public async sendMessage(type: string, message: {}) {
    if (this.room) {
      this.room.send(type, message);
    }
  }

  public async leave(redirectToHome = true) {
    if (this.room) {
      this.room.leave();
      this.room.removeAllListeners();
      this.room = undefined;
      if (DraftService.isLocalStorageAvailable) {
        localStorage.removeItem('sessionId');
        localStorage.removeItem('roomId');
        localStorage.removeItem('reconnectToken');
      }
      if (redirectToHome) this.router.navigate(['/']);
    }
  }
}
