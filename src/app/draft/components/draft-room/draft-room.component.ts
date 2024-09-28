import { Component, OnInit, inject } from '@angular/core';
import { DraftService } from '../../services/draft.service';
import { Player } from '../../../models/colyseus-schema/PlayerSchema';
import { Item } from '../../../models/colyseus-schema/ItemSchema';
import { CharacterSheetComponent } from '../character-sheet/character-sheet.component';
import { ShopComponent } from '../shop/shop.component';
import { DraftMenuComponent } from '../draft-menu/draft-menu.component';
import { TalentsComponent } from '../talents/talents.component';
import { Talent } from '../../../models/colyseus-schema/TalentSchema';
import { MatTooltip } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import {
  TriggerCollectionMessage,
  TriggerTalentMessage,
} from '../../../models/message-types/MessageTypes';
import {
  triggerTalentActivation,
  triggerItemCollectionActivation,
} from '../../../common/TriggerAnimations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ItemCollection } from '../../../models/colyseus-schema/ItemCollectionSchema';
import {
  MatDialogModule,
  MAT_DIALOG_DATA,
  MatDialog,
} from '@angular/material/dialog';

@Component({
  selector: 'app-draft-room',
  standalone: true,
  imports: [
    CharacterSheetComponent,
    ShopComponent,
    DraftMenuComponent,
    TalentsComponent,
    MatTooltip,
    MatButtonModule,
    MatDialogModule,
  ],
  templateUrl: './draft-room.component.html',
  styleUrl: './draft-room.component.scss',
})
export class DraftRoomComponent implements OnInit {
  player?: Player;
  shop?: Item[];
  availableTalents?: Talent[];
  availableCollections?: ItemCollection[];
  activeCollections?: ItemCollection[];
  talentDialog = inject(MatDialog);

  constructor(
    public draftService: DraftService,
    private snackBar: MatSnackBar
  ) {
    this.player = new Player();
    this.shop = [] as Item[];
    this.availableTalents = [] as Talent[];
    this.availableCollections = [] as ItemCollection[];
    this.activeCollections = [] as ItemCollection[];
  }

  openDialog(): void {
    const dialogRef = this.talentDialog.open(TalentsComponent, {
      data: { name: '', animal: '' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result !== undefined) {
        console.log('The dialog was closed');
        console.log(result);
      }
    });
  }

  async ngOnInit(): Promise<void> {
    if (!this.draftService.room) {
      await this.draftService.reconnect(
        localStorage.getItem('reconnectToken') as string
      );
    }

    this.draftService.room?.onMessage(
      'trigger_talent',
      (message: TriggerTalentMessage) => {
        triggerTalentActivation(message.talentId, message.playerId);
        console.log('trigger_talent', message);
      }
    );

    this.draftService.room?.onMessage(
      'trigger_collection',
      (message: TriggerCollectionMessage) => {
        if (this.player) {
          triggerItemCollectionActivation(
            message.collectionId,
            message.playerId
          );
          console.log('trigger_collection', message);
        }
      }
    );

    this.draftService.room?.onMessage('draft_log', (message: string) => {
      console.log('draft_log', message);
      this.snackBar.open(message, 'Close', {
        duration: 3000,
      });
    });

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
      this.availableCollections = state.player
        .availableItemCollections as ItemCollection[];
      this.activeCollections = state.player
        .activeItemCollections as ItemCollection[];
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
