import { Component, Input } from '@angular/core';
import { Item } from '../../../models/colyseus-schema/ItemSchema';
import { MatCardModule } from '@angular/material/card';
import { DraftService } from '../../services/draft.service';
import { TitleCasePipe, NgClass } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChip } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [
    NgClass,
    MatCardModule,
    TitleCasePipe,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatChip,
  ],
  templateUrl: './shop.component.html',
  styleUrl: './shop.component.css',
})
export class ShopComponent {
  hoverShopRefresh = false;
  hoverTelentRefresh = false;

  constructor(public draftService: DraftService) {
    this.shop = [] as Item[];
    this.playerLevel = 0;
    this.playerGold = 0; 
  }

  @Input({ required: true }) shop: Item[];
  @Input({ required: true }) playerLevel: number;
  @Input({ required: true }) playerGold: number;

  onMouseEnterItem(item: Item) {
    item.showDetails = true;
    item.imageCache = item.image;
    console.log(item);
    // item.image = 'https://chungus-battles.b-cdn.net/chungus-battles-assets/Item_ID_0_Empty.png';
    item.image =
      'https://chungus-battles.b-cdn.net/chungus-battles-assets/Item_ID_00_Empty_Orange.png';
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

  switchShopRefreshAnimate() {
    this.hoverShopRefresh = !this.hoverShopRefresh;
  }

  switchTalentRefreshAnimate() {
    this.hoverTelentRefresh = !this.hoverTelentRefresh;
  }

}
