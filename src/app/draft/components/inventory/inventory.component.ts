import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Player } from '../../../models/colyseus-schema/PlayerSchema';
import { Item } from '../../../models/colyseus-schema/ItemSchema';
import { NgClass } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { ItemCollection } from '../../../models/colyseus-schema/ItemCollectionSchema';
import { DraftService } from '../../services/draft.service';
import { ItemCardComponent } from '../../../common/item-card/item-card.component';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [NgClass, MatCardModule, MatButtonModule, MatMenuModule, ItemCardComponent],
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
  onMouseEnterItem(item: Item) {
    item.showDetails = true;
    item.imageCache = item.image;
    item.image = `https://chungus-battles.b-cdn.net/chungus-battles-assets/level_${item.tier}_glow.png`;
  }

  onMouseLeaveItem(item: Item) {
    item.showDetails = false;
    item.image = item.imageCache!;
  }

  getSellPrice(item: Item) {
    return Math.floor(item.price * 0.7);
  }

  getItemImage(item: Item) {
    return item.image ? item.image : 'https://chungus-battles.b-cdn.net/chungus-battles-assets/Item_ID_0_Empty.png';
  }

  backToDefault() {
    this.isDisplayingSets = false;
    this.displayedInventory = [...this.player.inventory];
  }

  sortByName() {
    this.isDisplayingSets = false;
    let itemsArray = [...this.player.inventory];
    if (this.isDescending) {
      const sortedByNameDesc = itemsArray.sort((a, b) => a.name.localeCompare(b.name));
      this.displayedInventory = sortedByNameDesc;
      this.isDescending = !this.isDescending;
    } else {
      const sortedByNameAsc = itemsArray.sort((a, b) => b.name.localeCompare(a.name));
      this.displayedInventory = sortedByNameAsc;
      this.isDescending = !this.isDescending;
    }
  }

  sortByLevel() {
    this.isDisplayingSets = false;
    let itemsArray = [...this.player.inventory];
    if (this.isDescending) {
      const sortedByLevel = itemsArray.sort((a, b) => b.tier - a.tier);
      this.displayedInventory = sortedByLevel;
      this.isDescending = !this.isDescending;
    } else {
      const sortedByLevel = itemsArray.sort((a, b) => a.tier - b.tier);
      this.displayedInventory = sortedByLevel;
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
  /*getAggregatedInventory(): {
    name: string;
    quantity: number;
    image: string;
  }[] {
    if (!this.player || !this.player.inventory) {
      return [];
    }

    const itemMap = new Map<string, { quantity: number; image: string }>();

    // Aggregate items by name and count quantity
    this.player.inventory.forEach((item: Item) => {
      if (itemMap.has(item.name)) {
        const existing = itemMap.get(item.name)!;
        itemMap.set(item.name, {
          quantity: existing.quantity + 1,
          image: item.image,
        });
      } else {
        itemMap.set(item.name, { quantity: 1, image: item.image });
      }
    });

    // Convert the map to an array for easier rendering
    const aggregatedInventory: {
      name: string;
      quantity: number;
      image: string;
    }[] = [];
    itemMap.forEach((value, name) => {
      aggregatedInventory.push({
        name,
        quantity: value.quantity,
        image: value.image,
      });
    });

    return aggregatedInventory;
  }

  getItemImage(item: { image: string }): string {
    return (
      item.image ||
      'https://chungus-battles.b-cdn.net/chungus-battles-assets/Item_ID_0_Empty.png'
    );
  }*/
}
