import { Injectable } from '@angular/core';
import * as Colyseus from 'colyseus.js'
import { environment } from '../environments/environment';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class DraftService {
  client: Colyseus.Client;
  playerId: number;
  room?: Colyseus.Room;

  constructor(private router: Router) {
    this.client = new Colyseus.Client(environment.gameServer);
    this.playerId = Math.floor(Math.random() * 1000);
    console.log("gameserver: ", this.client);
  }

  public async joinOrCreate(name: string) {
    try {
      this.playerId = Math.floor(Math.random() * 1000);
      this.room = await this.client.joinOrCreate("draft_room", {
        name: name,
        playerId: this.playerId
      });

      console.log("joined successfully", this.room);
      this.router.navigate(['/draft', this.room.sessionId], {
        queryParams: { session: this.room.sessionId },
      });

    } catch (e) {
      console.error("join error", e);
    }
  }

  public async sendMessage(type: string, message: string) {
    if (this.room) {
      this.room.send(type, message);
    }
  }
}
