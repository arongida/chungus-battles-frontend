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
  CdkDragDrop,
  CdkDragExit,
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
} from '../../../common/components/item-card/item-card.component';
import {
  CharacterDetailsService,
} from '../../../common/services/character-details.service';
import { InfoHintDirective } from '../../../common/directives/info-hint.directive';
import { InfoContent } from '../../../common/models/info-content';
import { ItemHoverCardDirective } from '../../../common/directives/item-hover-card.directive';
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
  dragPosition = { x: 0, y: 0 };
  draggingCard = false;
  dragIndex = 0;
  previewBuyItem = false;
  tempCard: HTMLElement | null = null;
  hoveredItem: Item | null = null;
  buyingItem: Item | null = null;

  constructor(
    public draftService: DraftService,
    private soundsService: SoundsService,
    public characterDetailsService: CharacterDetailsService,
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

  cardDragStarted(item: Item) {
    this.draggingCard = true;
    this.hoveredItem = null;
    this.dragIndex = this.shop.indexOf(item);
    this.draggedCard = item;
  }

  onDrop(event: CdkDragDrop<any[]>) {
    this.draggingCard = false;
    this.draggedCard = null;
    const item = this.shop[event.previousIndex];
    if (this.canBuyItem(item)) {
      this.buyItem(item);
    }
  }

  canBuyItem(item: Item | null) {
    if (!item) return false;
    return this.player.gold >= item.price && !item.sold;
  }

  getItemInfoHint(item: Item): InfoContent {
    const isUpgrade = item.upgradePreview;
    if (isUpgrade) {
      return {
        id: 'upgrade-item',
        title: `Upgrade: ${item.name}`,
        entries: [
          { icon: '⬆️', label: 'Upgrade Available', text: `You already own ${item.name}. Buying it again will upgrade it to a higher rarity tier, making it more powerful.` },
          { icon: '🟡', label: 'Cost', text: `${item.price} gold to upgrade.` },
          { icon: '🖱️', label: 'How to buy', text: 'Click the Buy button or drag the item to the drop zone at the bottom.' },
        ],
      };
    }
    return {
      id: 'buy-item',
      title: `Buy: ${item.name}`,
      entries: [
        { icon: '🛒', label: 'Buy Item', text: `Costs ${item.price} gold. After buying, the item goes to your inventory.` },
        { icon: '🗡️', label: 'Equip It', text: 'Open your character details (avatar button) and use the Equip button.' },
        { icon: '🖱️', label: 'How to buy', text: 'Click the Buy button or drag the item to the drop zone at the bottom.' },
      ],
    };
  }

  getBuyingTooltip() {
    return this.canBuyItem(this.draggedCard)
      ? (this.draggedCard?.upgradePreview ? 'Upgrade for ' : 'Buy for ') + this.draggedCard?.price
      : 'Not enough money!';
  }


  buyItem(item: Item) {
    this.buyingItem = item;
    setTimeout(() => this.buyingItem = null, 0);
    this.draftService.sendMessage('buy', {
      itemId: item.itemId,
    });
    this.soundsService.playSound(SoundOptions.BUY);
    this.previewBuyItem = false;
    this.tempCard?.remove();
    this.tempCard = null;
    this.characterDetailsService.showTalentPicker.set(false);
  }

  resetDrag(_item: Item) {
    this.draggingCard = false;
    this.dragPosition = { x: 0, y: 0 };
    this.tempCard?.remove();
    this.tempCard = null;
  }

  canBuyItemPredicate = () => {
    return this.canBuyItem(this.draggedCard);
  };

  onDragExited(_event: CdkDragExit, cardElementRef: HTMLElement, gridRef: HTMLElement) {
    if (this.tempCard) return;
    const cardElement = cardElementRef.childNodes[0].cloneNode(true);
    gridRef.insertBefore(cardElement, gridRef.childNodes[this.dragIndex * 2]);
    this.tempCard = cardElement as HTMLElement;
  }

  onDragExitFromBuyZone() {
    this.previewBuyItem = false;
    this.tempCard?.remove();
    this.tempCard = null;
  }

  preventDropBack(): boolean {
    return false;
  }

}
