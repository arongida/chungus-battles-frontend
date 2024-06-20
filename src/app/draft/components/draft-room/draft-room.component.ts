import { Component, OnInit } from '@angular/core';
import { DraftService } from '../../services/draft.service';
import { Player } from '../../../models/colyseus-schema/PlayerSchema';
import { Item } from '../../../models/colyseus-schema/ItemSchema';
import { Router } from '@angular/router';
import { CharacterSheetComponent } from '../character-sheet/character-sheet.component';
import { ShopComponent } from '../shop/shop.component';
import { DraftMenuComponent } from '../draft-menu/draft-menu.component';
import { TalentsComponent } from '../talents/talents.component';
import { Talent } from '../../../models/colyseus-schema/TalentSchema';
import { MatTooltip } from '@angular/material/tooltip';
import { MatButton } from '@angular/material/button';

@Component({
  selector: 'app-draft-room',
  standalone: true,
  imports: [
    CharacterSheetComponent,
    ShopComponent,
    DraftMenuComponent,
    TalentsComponent,
    MatTooltip,
    MatButton,
  ],
  templateUrl: './draft-room.component.html',
  styleUrl: './draft-room.component.css',
})
export class DraftRoomComponent implements OnInit {
  player?: Player;
  shop?: Item[];
  availableTalents?: Talent[];

  constructor(
    public draftService: DraftService,
    private router: Router,
  ) {
    this.player = new Player();
    this.shop = [] as Item[];
    this.availableTalents = [] as Talent[];
  }

  async ngOnInit(): Promise<void> {
    if (!this.draftService.room) {
      await this.draftService.reconnect(
        localStorage.getItem('reconnectToken') as string,
      );
    }

    // Listen to changes in the room state
    this.draftService.room?.onStateChange((state) => {
      // Assuming state.player is a plain object
      const plainPlayerObject = state.player;

      // Create a new Player instance
      const player = new Player();

      // Copy properties from the plain object to the new Player instance
      Object.assign(player, plainPlayerObject);

      // Assign the Player instance to this.player
      this.player = player;

      this.shop = state.shop as Item[];
      this.availableTalents = state.availableTalents as Talent[];
    });
  }

  getLivesString(): string {
    let lives = '';
    if (this.player) {
      for (let i = 0; i < this.player.lives; i++) {
        lives += '❤️ ';
      }
    }
    return lives;
  }

  getPlayerWins(): number {
    return this.player?.wins || 0;
  }
}
