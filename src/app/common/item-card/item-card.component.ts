import { Component, Input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { TitleCasePipe, DecimalPipe, NgClass } from '@angular/common';
import { Item } from '../../models/colyseus-schema/ItemSchema';
import { Player } from '../../models/colyseus-schema/PlayerSchema';
import { ItemCollection } from '../../models/colyseus-schema/ItemCollectionSchema';

@Component({
  selector: 'app-item-card',
  standalone: true,
  imports: [MatCardModule, TitleCasePipe, DecimalPipe, NgClass],
  templateUrl: './item-card.component.html',
  styleUrl: './item-card.component.scss',
})
export class ItemCardComponent {
  @Input({ required: true }) item: Item = new Item();
  @Input({ required: true }) player: Player = new Player();

  getItemsCollectionTooltipForItem(item: Item): string {
    const collections = this.player.availableItemCollections.filter((collection) =>
      item.itemCollections.includes(collection.itemCollectionId)
    );
    const formatCollections = collections
      .map((collection: ItemCollection) => {
        return `${collection.name} (${this.player.getItemcollectionItemCountFromEquip(
          collection.itemCollectionId
        )}/${collection.name.includes('Shield') ? 1 : 3}) - 
        ${collection.effect}`;
      })
      .join('\r\n');

    return formatCollections;
  }

  getIfItemHasActiveSet(item: Item): boolean {
    return this.player.activeItemCollections.some((collection) => item.itemCollections.includes(collection.itemCollectionId));
  }
}
