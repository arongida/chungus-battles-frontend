import { Component, ElementRef, Input, viewChild } from '@angular/core';
import { Item } from '../../../models/colyseus-schema/ItemSchema';
import { MatCardModule } from '@angular/material/card';
import { DraftService } from '../../services/draft.service';
import { TitleCasePipe, NgClass } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatChip } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { DecimalPipe } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ItemCollection } from '../../../models/colyseus-schema/ItemCollectionSchema';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDragStart,
  CdkDropList,
  DragDropModule,
} from '@angular/cdk/drag-drop';

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

  constructor(public draftService: DraftService) {
    this.shop = [] as Item[];
    this.playerLevel = 0;
    this.playerGold = 0;
    this.refreshShopCost = 0;
    this.availableCollections = [] as ItemCollection[];
  }

  @Input({ required: true }) shop: Item[];
  @Input({ required: true }) playerLevel: number;
  @Input({ required: true }) playerGold: number;
  @Input({ required: true }) refreshShopCost: number;
  @Input({ required: true }) availableCollections: ItemCollection[];

  onMouseEnterItem(item: Item) {
    item.showDetails = true;
    item.imageCache = item.image;
    item.image = `https://chungus-battles.b-cdn.net/chungus-battles-assets/level_${item.tier}_glow.png`;
  }

  onMouseLeaveItem(item: Item) {
    item.showDetails = false;
    item.image = item.imageCache ? item.imageCache : item.image;
  }

  getItemImage(item: Item) {
    return item.image
      ? item.image
      : 'https://chungus-battles.b-cdn.net/chungus-battles-assets/Item_ID_0_Empty.png';
  }

  getItemsCollectionTooltipForItem(item: Item): string {
    const collections = this.availableCollections.filter((collection) =>
      item.itemCollections.includes(collection.itemCollectionId)
    );
    return collections.map((collection) => collection.name).join('\r\n');
  }

  cardDragStarted(item: Item) {
  }

  onDrop(event: CdkDragDrop<any[]>) {
    // Get the dragged item from the event
    const item = this.shop[event.previousIndex];

    // Check if the player has enough gold and the item is not sold
    if (this.playerGold >= item.price && !item.sold) {
      this.buyItem(item);
    }
  }

  buyItem(item: Item) {
    this.draftService.sendMessage('buy', { itemId: item.itemId });
  }

  resetDrag(item: Item) {
    this.dragPosition = { x: 0, y: 0 };
    this.onMouseLeaveItem(item);
  }

  onDragEnter(event: any) {
    console.log('drag enter:', event);
  }
}
