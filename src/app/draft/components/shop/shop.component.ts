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
import { ItemCollection } from '../../../models/colyseus-schema/ItemCollectionSchema';

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
    MatTooltipModule
  ],
  templateUrl: './shop.component.html',
  styleUrl: './shop.component.scss',
})
export class ShopComponent {
  hoverShopRefresh = false;
  hoverBuyXp = false;

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
    item.image =
      `https://chungus-battles.b-cdn.net/chungus-battles-assets/level_${item.tier}_glow.png`;
  }

  onMouseLeaveItem(item: Item) {
    item.showDetails = false;
    item.image = item.imageCache!;
  }

  getItemImage(item: Item) {
    return item.image
      ? item.image
      : 'https://chungus-battles.b-cdn.net/chungus-battles-assets/Item_ID_0_Empty.png';
  }

  getItemsCollectionTooltipForItem(item: Item) : string{
    const collections = this.availableCollections.filter((collection) => item.itemCollections.includes(collection.itemCollectionId));
    return collections.map((collection) => collection.name).join("\r\n");
    
  }

}
