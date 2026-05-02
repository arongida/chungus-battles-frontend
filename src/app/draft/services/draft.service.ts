import { Injectable, signal } from '@angular/core';
import * as Colyseus from '@colyseus/sdk';
import {
  environment,
} from '../../../environments/environment';
import { Router } from '@angular/router';
import {
  DraftState,
} from '../../models/colyseus-schema/DraftState';
import {
  Player,
} from '../../models/colyseus-schema/PlayerSchema';

@Injectable({
  providedIn: 'root',
})
export class DraftService {
  client: Colyseus.Client;
  room = signal<Colyseus.Room<DraftState> | null>(null);
  player: Player | undefined;


  static isLocalStorageAvailable = typeof localStorage !== 'undefined';

  constructor(private router: Router) {
    this.client = new Colyseus.Client(environment.gameServer);
  }

  public async joinOrCreate(name?: string, playerIdInput?: number, avatarUrl?: string): Promise<string | null> {
    try {
      let playerId = playerIdInput;
      if (!playerId) {
        const result = await fetch(environment.gameServer + '/playerId')
          .then((res) => res.json())
          .catch((e) => console.error(e));
        playerId = result.playerId;
      }

      const room = await this.client.create('draft_room', {
        name: name,
        playerId: playerId,
        avatarUrl: avatarUrl,
      });

      this.room.set(room);

      room.onMessage('*', (type, message) => {
        console.log('message: ', type, message);
      });

      console.log('joined successfully', room);

      if (DraftService.isLocalStorageAvailable) {
        localStorage.setItem('sessionId', room.sessionId);
        localStorage.setItem('playerId', playerId!.toString());
        localStorage.setItem('roomId', room.roomId);
        localStorage.setItem('reconnectToken', room.reconnectionToken);
      }

      this.router.navigate(['/draft', room.sessionId]);
      return null;
    } catch (e) {
      console.error('join error', e);
      return e instanceof Error ? e.message : 'Unknown error.';
    }
  }

  public async reconnect(reconnectionToken: string) {
    try {
      console.log('[DraftService] reconnecting...');
      const room = await this.client.reconnect(reconnectionToken);
      console.log('[DraftService] reconnected, room:', room.roomId, 'state player:', room.state?.player?.name);

      room.onMessage('*', (type, message) => {
        console.log('message: ', type, message);
      });

      if (DraftService.isLocalStorageAvailable) {
        localStorage.setItem('sessionId', room.sessionId);
        localStorage.setItem('roomId', room.roomId);
        localStorage.setItem('reconnectToken', room.reconnectionToken);
      }

      this.room.set(room);
    } catch (e) {
      console.error('[DraftService] reconnect error', e);
      this.router.navigate(['/']);
    }
  }

  public async sendMessage(type: string, message: {}) {
    const room = this.room();
    if (room) {
      room.send(type, message);
    }
  }

  public async leave(redirectToHome = true) {
    const room = this.room();
    if (room) {
      room.leave();
      room.removeAllListeners();
      this.room.set(null);
      if (redirectToHome) this.router.navigate(['/']);
    }
  }
}
