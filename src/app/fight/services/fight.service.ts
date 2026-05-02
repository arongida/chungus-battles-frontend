import { Injectable, signal } from '@angular/core';
import * as Colyseus from '@colyseus/sdk';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';
import { FightState } from '../../models/colyseus-schema/FightState';

@Injectable({
  providedIn: 'root',
})
export class FightService {
  client: Colyseus.Client;
  room = signal<Colyseus.Room<FightState> | null>(null);

  static isLocalStorageAvailable = typeof localStorage !== 'undefined';

  constructor(private router: Router) {
    this.client = new Colyseus.Client(environment.gameServer);
    console.log(`[FightService] client created server=${environment.gameServer}`);
  }

  public async joinOrCreate(playerId: number) {
    console.log(`[FightService] creating fight_room playerId=${playerId}`);
    try {
      this.room.set(
        await this.client.create('fight_room', {
          playerId: playerId,
        }),
      );

      const room = this.room();
      console.log(`[FightService] fight_room created roomId=${room?.roomId} sessionId=${room?.sessionId}`);

      if (FightService.isLocalStorageAvailable && room) {
        localStorage.setItem('sessionId', room.sessionId);
        localStorage.setItem('roomId', room.roomId);
        localStorage.setItem('reconnectToken', room.reconnectionToken);
      }

      this.router.navigate(['/fight', room!.sessionId]);
    } catch (e) {
      console.error('[FightService] joinOrCreate error', e);
    }
  }

  public async reconnect(reconnectionToken: string) {
    console.log(`[FightService] reconnect attempt token=${reconnectionToken.slice(0, 8)}…`);
    try {
      this.room.set(await this.client.reconnect(reconnectionToken));

      const room = this.room();
      console.log(`[FightService] reconnect succeeded roomId=${room?.roomId} sessionId=${room?.sessionId}`);

      room?.onLeave((code) => {
        console.warn(`[FightService] room left after reconnect code=${code}`);
      });

      if (FightService.isLocalStorageAvailable && room) {
        localStorage.setItem('sessionId', room.sessionId);
        localStorage.setItem('roomId', room.roomId);
        localStorage.setItem('reconnectToken', room.reconnectionToken);
      }

      this.router.navigate(['/fight', room!.sessionId]);
    } catch (e) {
      console.error('[FightService] reconnect error', e);
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
      // if (FightService.isLocalStorageAvailable) {
      //   localStorage.removeItem('sessionId');
      //   localStorage.removeItem('roomId');
      //   localStorage.removeItem('reconnectToken');
      // }
      if (redirectToHome) this.router.navigate(['/']);
    }
  }
}
