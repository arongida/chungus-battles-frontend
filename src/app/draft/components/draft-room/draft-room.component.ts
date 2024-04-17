import { Component, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { DraftService } from '../../services/draft.service';
import { Player } from '../../../models/player';
import { Item } from '../../../models/item';
import { MatButtonModule } from '@angular/material/button'
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NgFor } from '@angular/common';
import { Router } from '@angular/router';
import { CharacterSheetComponent } from '../character-sheet/character-sheet.component';
import { ShopComponent } from '../shop/shop.component';

@Component({
  selector: 'app-draft-room',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, ReactiveFormsModule, NgFor, CharacterSheetComponent, ShopComponent],
  templateUrl: './draft-room.component.html',
  styleUrl: './draft-room.component.css'
})
export class DraftRoomComponent implements OnInit {
  player?: Player;
  playerData?: string;
  shop?: Item[];

  constructor(public draftService: DraftService, private router: Router) {
    this.player = {} as Player;
    this.shop = [] as Item[];
  }

  async ngOnInit(): Promise<void> {

    if (!this.draftService.room) {
      await this.draftService.reconnect(localStorage.getItem('reconnectToken') as string);
    }

    this.draftService.room?.onStateChange((state) => {
      this.player = state.player as Player;
      this.shop = state.shop as Item[];
      console.log("player state", this.player);
      console.log("shop state", this.shop);

      this.playerData = JSON.stringify(this.player, null, 2);
    });
  }
}
