import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  Player,
} from '../../../models/colyseus-schema/PlayerSchema';
import Item from '../../../models/colyseus-schema/ItemSchema';
import { NgClass } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import {
  ItemCollection,
} from '../../../models/colyseus-schema/ItemCollectionSchema';
import { DraftService } from '../../services/draft.service';
import {
  ItemCardComponent,
} from '../../../common/components/item-card/item-card.component';
import {
  ItemHoverCardDirective,
} from '../../../common/directives/item-hover-card.directive';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [NgClass, MatCardModule, MatButtonModule, MatMenuModule, ItemCardComponent, ItemHoverCardDirective],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.scss',
})
export class InventoryComponent {
  player: Player;
  displayedInventory: Item[];
  isDescending: boolean;
  isCollectionsVisible: boolean;
  isDisplayingSets: boolean;
  selectedItemCollection: ItemCollection | null = null;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { player: Player },
    public draftService: DraftService
  ) {
    this.player = data.player;
    this.displayedInventory = Array.from(this.player.inventory);
    this.isDescending = false;
    this.isCollectionsVisible = false;
    this.isDisplayingSets = false;
    this.selectedItemCollection = null;
  }
  getSellPrice(item: Item) {
    return Math.floor(item.sellPrice);
  }

  getItemImage(item: Item) {
    return item.image ? item.image : 'assets/Item_ID_0_Empty.png';
  }

  backToDefault() {
    this.isDisplayingSets = false;
    this.displayedInventory = [...this.player.inventory];
  }

  sortByName() {
    this.isDisplayingSets = false;
    let itemsArray = [...this.player.inventory];
    if (this.isDescending) {
      this.displayedInventory = itemsArray.sort((a, b) => a.name.localeCompare(b.name));
      this.isDescending = !this.isDescending;
    } else {
      this.displayedInventory = itemsArray.sort((a, b) => b.name.localeCompare(a.name));
      this.isDescending = !this.isDescending;
    }
  }

  sortByLevel() {
    this.isDisplayingSets = false;
    let itemsArray = [...this.player.inventory];
    if (this.isDescending) {
      this.displayedInventory = itemsArray.sort((a, b) => b.tier - a.tier);
      this.isDescending = !this.isDescending;
    } else {
      this.displayedInventory = itemsArray.sort((a, b) => a.tier - b.tier);
      this.isDescending = !this.isDescending;
    }
  }



  sellSelectedItem(item: Item) {
    this.draftService.sendMessage('sell', {
      itemId: item.itemId,
    });
    this.displayedInventory = this.player.inventory.filter((soldItem) => soldItem.itemId !== item.itemId);
  }

  equip(item: Item) {
    this.draftService.sendMessage('equip', {
      itemId: item.itemId,
    });
  }
  }
