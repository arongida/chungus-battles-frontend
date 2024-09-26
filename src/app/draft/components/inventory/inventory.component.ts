import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Player } from '../../../models/colyseus-schema/PlayerSchema';
import { Item } from '../../../models/colyseus-schema/ItemSchema';
import { DecimalPipe, NgClass, TitleCasePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatChip } from '@angular/material/chips';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [
    NgClass,
    TitleCasePipe,
    MatCardModule,
    MatChip,
    DecimalPipe
  ],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.scss',
})
export class InventoryComponent {
  player: Player;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { player: Player }
  ) {
    this.player = data.player;
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
