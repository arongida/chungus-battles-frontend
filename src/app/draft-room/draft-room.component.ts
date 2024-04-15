import { Component, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { DraftService } from '../draft.service';
import { Player } from '../models/player';
import { MatButtonModule } from '@angular/material/button'
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-draft-room',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, ReactiveFormsModule],
  templateUrl: './draft-room.component.html',
  styleUrl: './draft-room.component.css'
})
export class DraftRoomComponent {
  player?: Player;
  playerData?: string;

  constructor(public draftService: DraftService) {

    draftService.room?.onStateChange((state) => {
      this.player = state.player as Player;
      console.log("player state", this.player);

      this.playerData = JSON.stringify(this.player, null, 2);
    });


  }
}
