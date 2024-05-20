import { Component, Input } from '@angular/core';
import { Item } from '../../../models/colyseus-schema/ItemSchema';
import { MatCardModule } from '@angular/material/card';
import { DraftService } from '../../services/draft.service';
import { NgFor } from '@angular/common';
import { MatButtonModule } from '@angular/material/button'
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [MatCardModule, NgFor, MatButtonModule, MatTooltipModule],
  templateUrl: './shop.component.html',
  styleUrl: './shop.component.css'
})
export class ShopComponent {

  constructor(public draftService: DraftService) {
    this.shop = [] as Item[];
  }

  @Input({ required: true }) shop: Item[];

  onMouseEnterItem(item: Item) {
    item.showDetails = true;
    item.imageCache = item.image;
    // item.image = 'https://chungus-battles.b-cdn.net/chungus-battles-assets/Item_ID_0_Empty.png';
    item.image = 'https://chungus-battles.b-cdn.net/chungus-battles-assets/Item_ID_00_Empty_Orange.png';
  }

  onMouseLeaveItem(item: Item) {
    item.showDetails = false;
    item.image = item.imageCache!;
  }

  getItemImage(item: Item) {
    return item.image ? item.image : 'https://chungus-battles.b-cdn.net/chungus-battles-assets/Item_ID_0_Empty.png';
  }

}
