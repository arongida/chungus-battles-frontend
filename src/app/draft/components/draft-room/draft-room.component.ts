import { Component, OnInit } from '@angular/core';
import { DraftService } from '../../services/draft.service';
import { Player } from '../../../models/colyseus-schema/DraftState'
import { Item } from '../../../models/item';
import { Router } from '@angular/router';
import { CharacterSheetComponent } from '../character-sheet/character-sheet.component';
import { ShopComponent } from '../shop/shop.component';
import { DraftMenuComponent } from '../draft-menu/draft-menu.component';

@Component({
  selector: 'app-draft-room',
  standalone: true,
  imports: [CharacterSheetComponent, ShopComponent, DraftMenuComponent],
  templateUrl: './draft-room.component.html',
  styleUrl: './draft-room.component.css'
})
export class DraftRoomComponent implements OnInit {
  player?: Player;
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
    });
  }
}
