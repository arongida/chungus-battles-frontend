import { Injectable } from '@angular/core';
import * as Colyseus from 'colyseus.js'
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';
import { FightState } from '../../models/colyseus-schema/FightState';

@Injectable({
  providedIn: 'root'
})
export class FightService {
  client: Colyseus.Client;
  playerId: number = 0;
  room: Colyseus.Room<FightState> | undefined;
  
  static isLocalStorageAvailable = typeof localStorage !== 'undefined';

  constructor(private router: Router) {
    this.client = new Colyseus.Client(environment.gameServer);
    //this.playerId = Math.floor(Math.random() * 1000);
    console.log("gameserver: ", this.client);
  }

  public async joinOrCreate(playerId: number) {
    try {
      this.room = await this.client.joinOrCreate("fight_room", {
        playerId: playerId
      });

      this.room.onMessage("*", (type, message) => {
        console.log("message: ", type, message);
      });

      console.log("joined successfully", this.room);

      if (FightService.isLocalStorageAvailable) {
        localStorage.setItem('sessionId', this.room.sessionId);
        localStorage.setItem('playerId', this.playerId.toString());
        localStorage.setItem('roomId', this.room.roomId);
        localStorage.setItem('reconnectToken', this.room.reconnectionToken);
      }

      this.router.navigate(['/fight', this.room.sessionId]);

    } catch (e) {
      console.error("join error", e);
    }
  }

  public async reconnect(reconnectionToken: string) {
    try {


      this.room = await this.client.reconnect(reconnectionToken);

      this.room.onMessage("*", (type, message) => {
        console.log("message: ", type, message);
      });

      console.log("reconnected", this.room);

      if (FightService.isLocalStorageAvailable) {
        localStorage.setItem('sessionId', this.room.sessionId);
        localStorage.setItem('roomId', this.room.roomId);
        localStorage.setItem('reconnectToken', this.room.reconnectionToken);
      }

      this.router.navigate(['/fight', this.room.sessionId]);
    } catch (e) {
      console.error("reconnect error", e);
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
      if (FightService.isLocalStorageAvailable) {
        localStorage.removeItem('sessionId');
        localStorage.removeItem('roomId');
        localStorage.removeItem('reconnectToken');
      }
      if (redirectToHome) this.router.navigate(['/']);
    }
  }

}
