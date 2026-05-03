import {
  Component,
  OnInit,
  effect,
  signal,
  untracked,
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

// Creates a typed Player from any schema object (typed or reflection-decoded generic).
// Copies primitive backing fields and collection references; skips `baseStats` because
// its Colyseus-generated setter calls assertInstanceType which fails with minified class
// names in production builds.
function coercePlayer(src: any): Player {
  if (!src) return new Player();
  const dest = new Player();
  Object.keys(src).forEach(key => {
    if (key === 'baseStats') return;
    try { (dest as any)[key] = src[key]; } catch {}
  });
  return dest;
}

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

  constructor(public draftService: DraftService, private snackBar: MatSnackBar, private soundsService: SoundsService) {
    effect(() => {
      const room = this.draftService.room();
      if (room) {
        // Apply current snapshot immediately — onStateChange does not replay on registration
        if (room.state?.player) {
          this.applyState(room.state);
        }
        room.onStateChange((state) => {
          this.applyState(state);
        });
        room.onMessage('draft_log', (message: string) => {
          console.log('draft_log', message);
          this.snackBar.open(message, 'Close', { duration: 5000, panelClass: 'chungus-snackbar' });
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
      await this.draftService.reconnect(untracked(() => localStorage.getItem('reconnectToken')) as string);
    }
  }

  private applyState(state: any): void {
    this.player.set(coercePlayer(state.player));
    this.shop.set([...(state.shop ?? [])] as unknown as Item[]);
    this.availableTalents.set([...(state.availableTalents ?? [])] as unknown as Talent[]);
    this.availableCollections.set([...(state.player?.availableItemCollections ?? [])] as unknown as ItemCollection[]);
  }
}
