import { Component, Input } from '@angular/core';
import { Item } from '../../../models/colyseus-schema/ItemSchema';
import { MatCardModule } from '@angular/material/card';
import { DraftService } from '../../services/draft.service';
import { TitleCasePipe, NgClass } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatChip } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { DecimalPipe } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDragExit,
  CdkDropList,
  DragDropModule,
} from '@angular/cdk/drag-drop';
import { Player } from '../../../models/colyseus-schema/PlayerSchema';

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [
    NgClass,
    MatCardModule,
    TitleCasePipe,
    MatButtonModule,
    MatIconModule,
    MatChip,
    DecimalPipe,
    MatTooltipModule,
    CdkDrag,
    CdkDropList,
    DragDropModule,
  ],
  templateUrl: './shop.component.html',
  styleUrl: './shop.component.scss',
})
export class ShopComponent {
  hoverShopRefresh = false;
  hoverBuyXp = false;
  dragPosition = { x: 0, y: 0 };
  draggingCard = false;
  dragIndex = 0;
  previewBuyItem = false;
  tempCard: HTMLElement | null = null;

  constructor(public draftService: DraftService) {
    this.shop = [] as Item[];
    this.player = new Player();
  }

  @Input({ required: true }) shop: Item[];
  @Input({ required: true }) player: Player;

  onMouseEnterItem(item: Item) {
    if (this.draggingCard) return;
    item.showDetails = true;
    item.imageCache = item.image;
    item.image = `https://chungus-battles.b-cdn.net/chungus-battles-assets/level_${item.tier}_glow.png`;
  }

  onMouseLeaveItem(item: Item) {
    if (this.draggingCard) return;
    item.showDetails = false;
    item.image = item.imageCache ? item.imageCache : item.image;
  }

  getItemImage(item: Item) {
    return item.image
      ? item.image
      : 'https://chungus-battles.b-cdn.net/chungus-battles-assets/Item_ID_0_Empty.png';
  }

  getItemsCollectionTooltipForItem(item: Item): string {
    const collections = this.player.availableItemCollections.filter((collection) =>
      item.itemCollections.includes(collection.itemCollectionId)
    );
    return collections.map((collection) => collection.name).join('\r\n');
  }

  cardDragStarted(item: Item) {
    this.draggingCard = true;
    this.dragIndex = this.shop.indexOf(item);
  }

  onDrop(event: CdkDragDrop<any[]>) {
    this.draggingCard = false;
    // Get the dragged item from the event
    const item = this.shop[event.previousIndex];
    // Check if the player has enough gold and the item is not sold
    if (this.player.gold >= item.price && !item.sold) {
      this.buyItem(item);
    }
  }

  buyItem(item: Item) {
    this.draftService.sendMessage('buy', { itemId: item.itemId });
    this.previewBuyItem = false;
    this.tempCard?.remove();
    this.tempCard = null;
  }

  resetDrag(item: Item) {
    this.draggingCard = false;
    this.dragPosition = { x: 0, y: 0 };
    this.onMouseLeaveItem(item);
    this.tempCard?.remove();
    this.tempCard = null;
  }

  onDragExited(
    event: CdkDragExit,
    cardElementRef: HTMLElement,
    gridRef: HTMLElement
  ) {
    if (this.tempCard) return;
    console.log('onDragExited', event, cardElementRef);
    //copy the card element to the original position
    const cardElement = cardElementRef.childNodes[0].cloneNode(true);
    //insert copy of the card element to the original position
    console.log('inserting at index ', this.dragIndex);
    console.log('gridRef.childNodes', gridRef.childNodes);  
    gridRef.insertBefore(cardElement, gridRef.childNodes[this.dragIndex * 2]);
    // gridRef.appendChild(cardElement);
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

  getNumberOfOwnedItems(item: Item): number {
    return this.player.inventory.filter((i) => i.itemId === item.itemId).length;
  }

  isCardHighlighted(item: Item): boolean {
    const isOwned = this.getNumberOfOwnedItems(item) > 0;
    const isTracked = item.itemCollections.some((collectionId) =>
      this.draftService.trackedCollectionIds().includes(collectionId)
    );
    console.log('isCardTracked', isTracked);
    return isTracked && !isOwned;
  }
}
