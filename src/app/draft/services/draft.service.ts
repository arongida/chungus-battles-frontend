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

      console.log(`[DraftService] creating draft_room playerId=${playerId}`);
      this.room.set(await this.client.create('draft_room', {
        name: name,
        playerId: playerId,
        avatarUrl: avatarUrl,
      }));

      const room = this.room()!;
      console.log(`[DraftService] draft_room created roomId=${room.roomId} sessionId=${room.sessionId}`);

      if (DraftService.isLocalStorageAvailable) {
        localStorage.setItem('sessionId', room.sessionId);
        localStorage.setItem('playerId', playerId!.toString());
        localStorage.setItem('roomId', room.roomId);
        localStorage.setItem('reconnectToken', room.reconnectionToken);
      }

      this.router.navigate(['/draft', room.sessionId]);
      return null;
    } catch (e) {
      console.error('[DraftService] joinOrCreate error', e);
      return e instanceof Error ? e.message : 'Unknown error.';
    }
  }

  public async reconnect(reconnectionToken: string) {
    console.log(`[DraftService] reconnect attempt token=${reconnectionToken.slice(0, 8)}…`);
    try {
      this.room.set(await this.client.reconnect(reconnectionToken, DraftState) as unknown as Colyseus.Room<DraftState>);
      const room = this.room()!;
      console.log(`[DraftService] reconnect succeeded roomId=${room.roomId} sessionId=${room.sessionId}`);

      room.onLeave((code) => {
        console.warn(`[DraftService] room left after reconnect code=${code}`);
      });

      if (DraftService.isLocalStorageAvailable) {
        localStorage.setItem('sessionId', room.sessionId);
        localStorage.setItem('roomId', room.roomId);
        localStorage.setItem('reconnectToken', room.reconnectionToken);
      }

      this.router.navigate(['/draft', room.sessionId]);
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
