import { Component, Input } from '@angular/core';
import Item from '../../../models/colyseus-schema/ItemSchema';
import { MatCardModule } from '@angular/material/card';
import { DraftService } from '../../services/draft.service';
import { NgClass } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  MatTooltipModule,
} from '@angular/material/tooltip';
import {
  CdkDrag,
  CdkDropList,
  DragDropModule,
} from '@angular/cdk/drag-drop';
import {
  Player,
} from '../../../models/colyseus-schema/PlayerSchema';
import {
  SoundOptions,
  SoundsService,
} from '../../../common/services/sounds.service';
import {
  ItemCardComponent,
  FreeClaimSource,
} from '../../../common/components/item-card/item-card.component';
import {
  CharacterDetailsService,
} from '../../../common/services/character-details.service';
import { InfoHintDirective } from '../../../common/directives/info-hint.directive';
import { InfoContent } from '../../../common/models/info-content';
import { ItemHoverCardDirective } from '../../../common/directives/item-hover-card.directive';
import { InfoBoxService } from '../../../common/services/info-box.service';
@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [
    NgClass,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    CdkDrag,
    CdkDropList,
    DragDropModule,
    ItemCardComponent,
    InfoHintDirective,
    ItemHoverCardDirective,
  ],
  templateUrl: './shop.component.html',
  styleUrl: './shop.component.scss',
})
export class ShopComponent {
  draggedCard: Item | null = null;
  draggingCard = false;
  dragIndex = 0;
  hoveredItem: Item | null = null;
  buyingItem: Item | null = null;

  constructor(
    public draftService: DraftService,
    private soundsService: SoundsService,
    public characterDetailsService: CharacterDetailsService,
    public infoBoxService: InfoBoxService,
  ) {
    this.shop = [] as Item[];
    this.player = new Player();
  }

  @Input({ required: true }) shop: Item[];
  @Input({ required: true }) player: Player;

  getItemImage(item: Item) {
    return item.image ? item.image : 'assets/Item_ID_0_Empty.png';
  }

  getGlowImage(item: Item): string {
    const tier = item.tier < 10 ? item.tier : item.tier - 90;
    return `assets/level_${tier}_glow.png`;
  }

  /**
   * Desktop-only inline hover state. Touch devices synthesize a mouseenter on tap for elements
   * with click handlers (shop items have several), so without this guard the first tap would
   * show this inline glow/details instead of reserving that tap for the hint/overlay gating.
   */
  isItemHovered(item: Item): boolean {
    return this.hoveredItem === item && !this.draggingCard && !this.infoBoxService.isTouch;
  }

  cardDragStarted(item: Item) {
    this.draggingCard = true;
    this.hoveredItem = null;
    this.dragIndex = this.shop.indexOf(item);
    this.draggedCard = item;
  }

  /** True if this lucky-find slot has been flipped to free by Black Market Contact's aura
   *  behavior (server-side; see TalentBehaviors.ts) — once-per-draft-phase, until bought. */
  isFreeLuckyFind(item: Item): boolean {
    return item.luckyFind && item.price === 0;
  }

  /** Which talent (if any) makes this item claimable for free — a Black Market Contact lucky
   *  find, Gold Genie's per-shop free claim (merchant-class items only), or Comrade's per-shop
   *  free-item claim (any unsold item). Narrowest/rarest source wins when more than one applies
   *  to the same item. Server-side logic in TalentBehaviors.ts / DraftRoom.buyItem. */
  freeClaimSource(item: Item): FreeClaimSource {
    if (this.isFreeLuckyFind(item)) return 'lucky-find';
    if (this.player.goldGenieFreeClaim && item.class === 'merchant' && !item.sold) return 'gold-genie';
    if (this.player.comradeFreeClaim && !item.sold) return 'comrade';
    return null;
  }

  /** True if this item is claimable for free by any source — see freeClaimSource. */
  isFreeClaimable(item: Item): boolean {
    return this.freeClaimSource(item) !== null;
  }

  getItemInfoHint(item: Item): InfoContent {
    const isUpgrade = item.upgradePreview;
    const isFree = this.isFreeClaimable(item);
    const costText = isFree ? 'Free — claim your item!' : `${item.price} gold`;
    if (isUpgrade) {
      return {
        id: 'upgrade-item',
        title: `Upgrade: ${item.name}`,
        entries: [
          { icon: '⬆️', label: 'Upgrade Available', text: `You already own ${item.name}. Buying it again will upgrade it to a higher rarity tier, making it more powerful.` },
          { icon: '🟡', label: 'Cost', text: isFree ? costText : `${costText} to upgrade.` },
          { icon: '🖱️', label: 'How to buy', text: 'Click the Buy button or drag the item onto your character panel.' },
        ],
      };
    }
    return {
      id: 'buy-item',
      title: `Buy: ${item.name}`,
      entries: [
        { icon: '🛒', label: 'Buy Item', text: isFree ? `${costText} After buying, the item goes to your inventory.` : `Costs ${costText}. After buying, the item goes to your inventory.` },
        { icon: '🖱️', label: 'How to buy', text: 'Click the Buy button or drag the item onto your character panel.' },
        { icon: '🗡️', label: 'Equip It', text: 'Open your character details (avatar button) and use the Equip button or drag the item to a slot.' },
      ],
    };
  }


  buyItem(item: Item) {
    this.buyingItem = item;
    setTimeout(() => this.buyingItem = null, 0);
    this.draftService.sendMessage('buy', {
      itemId: item.itemId,
    });
    this.soundsService.playSound(SoundOptions.BUY);
    this.characterDetailsService.showTalentPicker.set(false);
    this.characterDetailsService.notifyPurchase();
  }

  resetDrag(_item: Item) {
    this.draggingCard = false;
  }

}
