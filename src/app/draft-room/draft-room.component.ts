import { Component, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { DraftService } from '../draft.service';
import { Player } from '../models/player';
import { Item } from '../models/item';
import { MatButtonModule } from '@angular/material/button'
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NgFor } from '@angular/common';

@Component({
  selector: 'app-draft-room',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, ReactiveFormsModule, NgFor],
  templateUrl: './draft-room.component.html',
  styleUrl: './draft-room.component.css'
})
export class DraftRoomComponent {
  player?: Player;
  playerData?: string;
  shop?: Item[];

  constructor(public draftService: DraftService) {

    draftService.room?.onStateChange((state) => {
      this.player = state.player as Player;
      this.shop = state.shop as Item[];
      console.log("player state", this.player);
      console.log("shop state", this.shop);

      this.playerData = JSON.stringify(this.player, null, 2);
    });


  }
}
