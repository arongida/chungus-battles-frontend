import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Player } from '../../../models/colyseus-schema/PlayerSchema';
import { Item } from '../../../models/colyseus-schema/ItemSchema';
import { DecimalPipe, NgClass, TitleCasePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatChip } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [
    NgClass,
    TitleCasePipe,
    MatCardModule,
    MatChip,
    DecimalPipe,
    MatButtonModule,
    MatMenuModule
  ],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.scss',
})
export class InventoryComponent {
  player: Player;
  displayedInventory: Item[];
  isDescending: boolean;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { player: Player }
  ) {
    this.player = data.player;
    this.displayedInventory = this.player.inventory;
    this.isDescending = false;
  }
  onMouseEnterItem(item: Item) {
    item.showDetails = true;
    item.imageCache = item.image;
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

  backToDefault() {
    this.displayedInventory = Array.from(this.player.inventory);
  }

  sortByName() {

    let itemsArray = Array.from(this.player.inventory);
    if(this.isDescending){
      const sortedByNameDesc = itemsArray.sort((a, b) => a.name.localeCompare(b.name));
      this.displayedInventory = sortedByNameDesc;
      this.isDescending = !this.isDescending;
    }else {
      const sortedByNameAsc = itemsArray.sort((a, b) => b.name.localeCompare(a.name));
      this.displayedInventory = sortedByNameAsc;
      this.isDescending = !this.isDescending;
    }
    

    
  }

  sortByLevel() {
    let itemsArray = [...this.player.inventory];
    if(this.isDescending){
      const sortedByLevel = itemsArray.sort((a, b) => b.tier - a.tier);
      this.displayedInventory = sortedByLevel;
      this.isDescending = !this.isDescending;
    }else{
      const sortedByLevel = itemsArray.sort((a, b) => a.tier - b.tier);
      this.displayedInventory = sortedByLevel;
      this.isDescending = !this.isDescending;
    }
    
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
