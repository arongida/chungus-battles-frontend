import {
  Component,
  NgZone,
  OnInit,
  effect,
  signal,
} from '@angular/core';
import { DraftService } from '../../services/draft.service';
import {
  Player,
} from '../../../models/colyseus-schema/PlayerSchema';
import Item from '../../../models/colyseus-schema/ItemSchema';
import { ShopComponent } from '../shop/shop.component';
import {
  ReadyButtonComponent,
} from '../ready-button/ready-button.component';
import {
  Talent,
} from '../../../models/colyseus-schema/TalentSchema';
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
import { DraftState } from '../../../models/colyseus-schema/DraftState';
import { TriggerItemMessage, TriggerTalentMessage } from '../../../models/types/MessageTypes';
import { triggerItemActivation, triggerTalentActivation } from '../../../common/TriggerAnimations';

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
  player = signal<Player | undefined>(new Player(), { equal: () => false });
  shop = signal<Item[]>([]);
  availableTalents = signal<Talent[]>([]);
  availableCollections = signal<ItemCollection[]>([]);

  constructor(
    public draftService: DraftService,
    private snackBar: MatSnackBar,
    private soundsService: SoundsService,
    private zone: NgZone,
  ) {
    effect(() => {
      const room = draftService.room();
      if (!room) return;

      console.log('[DraftRoom] effect fired, room:', room.roomId, 'state player:', room.state?.player?.name);

      const applyState = (state: typeof room.state) => {
        this.zone.run(() => {
          this.player.set(new Player().assign(state.player));
          this.shop.set([...(state.shop ?? [])] as unknown as Item[]);
          this.availableTalents.set([...(state.availableTalents ?? [])] as unknown as Talent[]);
          this.availableCollections.set([...(state.player?.availableItemCollections ?? [])] as unknown as ItemCollection[]);
        });
        room.onMessage('trigger_talent', (message: TriggerTalentMessage) => {
          if (this.player()) {
            //triggerTalentActivation(message.talentId, message.playerId);
          }
        });

        room.onMessage('trigger_item', (message: TriggerItemMessage) => {
          if (this.player()) {
            //triggerItemActivation(message.playerId, message.slot);
          }
        });
      }
    });
  }

  async ngOnInit(): Promise<void> {
    this.soundsService.playMusic(MusicOptions.DRAFT);
    if (!this.draftService.room()) {
      await this.draftService.reconnect(localStorage.getItem('reconnectToken') as string);
    }
  }

  private applyState(state: DraftState): void {
    this.player.set(state.player);
    this.shop.set([...(state.shop ?? [])] as unknown as Item[]);
    this.availableTalents.set([...(state.availableTalents ?? [])] as unknown as Talent[]);
    this.availableCollections.set([...(state.player?.availableItemCollections ?? [])] as unknown as ItemCollection[]);
  }
}
