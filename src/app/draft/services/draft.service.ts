import { Injectable } from '@angular/core';
import * as Colyseus from 'colyseus.js'
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';
import { Player } from '../../models/player';
import { DraftState } from '../../models/colyseus-schema/DraftState';

@Injectable({
  providedIn: 'root'
})
export class DraftService {
  client: Colyseus.Client;
  playerId?: number;
  room?: Colyseus.Room<DraftState>;
  static isLocalStorageAvailable = typeof localStorage !== 'undefined';
  player?: Player;

  constructor(private router: Router) {
    this.client = new Colyseus.Client(environment.gameServer);
    //this.playerId = Math.floor(Math.random() * 1000);
    console.log("gameserver: ", this.client);
  }

  public async joinOrCreate(name: string) {
    try {
      this.playerId = Math.floor(Math.random() * 1000);
      this.room = await this.client.joinOrCreate("draft_room", {
        name: name,
        playerId: this.playerId
      });

      this.room.onMessage("*", (type, message) => {
        console.log("message: ", type, message);
      });

      console.log("joined successfully", this.room);

      if (DraftService.isLocalStorageAvailable) {
        localStorage.setItem('sessionId', this.room.sessionId);
        localStorage.setItem('playerId', this.playerId.toString());
        localStorage.setItem('roomId', this.room.roomId);
        localStorage.setItem('reconnectToken', this.room.reconnectionToken);
      }

      this.router.navigate(['/draft', this.room.sessionId]);

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

      if (DraftService.isLocalStorageAvailable) {
        localStorage.setItem('sessionId', this.room.sessionId);
        localStorage.setItem('roomId', this.room.roomId);
        localStorage.setItem('reconnectToken', this.room.reconnectionToken);
      }

      this.router.navigate(['/draft', this.room.sessionId]);
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
}
