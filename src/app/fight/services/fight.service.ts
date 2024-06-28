import { Injectable, signal } from '@angular/core';
import * as Colyseus from 'colyseus.js';
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
    //this.playerId = Math.floor(Math.random() * 1000);
    console.log('gameserver: ', this.client);
  }

  public async joinOrCreate(playerId: number) {
    try {
      this.room.set(
        await this.client.joinOrCreate('fight_room', {
          playerId: playerId,
        }),
      );

      //this.roomSignal.set(this.room);

      // this.room.onMessage("*", (type, message) => {
      //   console.log("message: ", type, message);
      // });

      const room = this.room();
      console.log('joined', room);

      if (FightService.isLocalStorageAvailable && room) {
        localStorage.setItem('sessionId', room.sessionId);
        localStorage.setItem('roomId', room.roomId);
        localStorage.setItem('reconnectToken', room.reconnectionToken);
      }

      this.router.navigate(['/fight', room!.sessionId]);
    } catch (e) {
      console.error('join error', e);
    }
  }

  public async reconnect(reconnectionToken: string) {
    try {
      this.room.set(await this.client.reconnect(reconnectionToken));

      const room = this.room();

      // this.room.onMessage("*", (type, message) => {
      //   console.log("message: ", type, message);
      // });

      console.log('reconnected', room);

      if (FightService.isLocalStorageAvailable && room) {
        localStorage.setItem('sessionId', room.sessionId);
        localStorage.setItem('roomId', room.roomId);
        localStorage.setItem('reconnectToken', room.reconnectionToken);
      }

      this.router.navigate(['/fight', room!.sessionId]);
    } catch (e) {
      console.error('reconnect error', e);
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
