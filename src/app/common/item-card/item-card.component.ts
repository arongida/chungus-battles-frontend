import { Component, Input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import {
  DecimalPipe,
  NgClass,
  TitleCasePipe,
} from '@angular/common';
import {
  Item,
} from '../../models/colyseus-schema/ItemSchema';
import {
  Player,
} from '../../models/colyseus-schema/PlayerSchema';
import {
  ItemCollection,
} from '../../models/colyseus-schema/ItemCollectionSchema';
import { ItemRarity } from '../../models/types/ItemTypes';

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
  @Input({ required: false }) setTooltipBasedOnInventory: boolean = false;
  @Input({ required: false }) showDetails = false;


  protected readonly ItemRarity = ItemRarity;
  protected readonly String = String;
}
