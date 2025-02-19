import {
  Component,
  OnInit,
  untracked,
} from '@angular/core';
import { DraftService } from '../../services/draft.service';
import {
  Player,
} from '../../../models/colyseus-schema/PlayerSchema';
import {
  Item,
} from '../../../models/colyseus-schema/ItemSchema';
import { ShopComponent } from '../shop/shop.component';
import {
  ReadyButtonComponent,
} from '../ready-button/ready-button.component';
import {
  Talent,
} from '../../../models/colyseus-schema/TalentSchema';
import {
  TriggerCollectionMessage,
  TriggerTalentMessage,
} from '../../../models/message-types/MessageTypes';
import {
  triggerTalentActivation,
  triggerItemCollectionActivation,
} from '../../../common/TriggerAnimations';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  ItemCollection,
} from '../../../models/colyseus-schema/ItemCollectionSchema';
import {
  RoundInfoComponent,
} from '../../../common/components/round-info/round-info.component';
import {
  DraftToolbarComponent,
} from '../../../common/components/draft-toolbar/draft-toolbar.component';
import {
  SkillIconsComponent,
} from '../../../common/components/skill-icons/skill-icons.component';
import {
  MusicOptions,
  SoundsService,
} from '../../../common/services/sounds.service';

@Component({
  selector: 'app-draft-room',
  standalone: true,
  imports: [
    ShopComponent,
    ReadyButtonComponent,
    RoundInfoComponent,
    ReadyButtonComponent,
    DraftToolbarComponent,
    SkillIconsComponent,
  ],
  templateUrl: './draft-room.component.html',
  styleUrl: './draft-room.component.scss',
})
export class DraftRoomComponent implements OnInit {
  player?: Player;
  shop?: Item[];
  availableTalents: Talent[];
  availableCollections?: ItemCollection[];

  constructor(public draftService: DraftService, private snackBar: MatSnackBar, private soundsService: SoundsService) {
    this.player = new Player();
    this.shop = [] as Item[];
    this.availableTalents = [] as Talent[];
    this.availableCollections = [] as ItemCollection[];
  }

  async ngOnInit(): Promise<void> {

    this.soundsService.playMusic(MusicOptions.DRAFT);

    if (!this.draftService.room) {
      await this.draftService.reconnect(untracked(() => localStorage.getItem('reconnectToken')) as string);
    }

    this.draftService.room?.onMessage('trigger_talent', (message: TriggerTalentMessage) => {
      triggerTalentActivation(message.talentId, message.playerId);
      console.log('trigger_talent', message);
    });

    this.draftService.room?.onMessage('trigger_collection', (message: TriggerCollectionMessage) => {
      if (this.player) {
        triggerItemCollectionActivation(message.collectionId, message.playerId);
      }
    });

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
      this.availableCollections = state.player.availableItemCollections as ItemCollection[];
    });
  }
}
