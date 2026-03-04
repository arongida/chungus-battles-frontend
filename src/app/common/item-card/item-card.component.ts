import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
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
import { ItemRarity } from '../../models/types/ItemTypes';

@Component({
  selector: 'app-item-card',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, TitleCasePipe, DecimalPipe, NgClass],
  templateUrl: './item-card.component.html',
  styleUrl: './item-card.component.scss',
})
export class ItemCardComponent {
  @Input({ required: true }) item: Item = new Item();
  @Input({ required: true }) player: Player = new Player();
  @Input({ required: false }) setTooltipBasedOnInventory: boolean = false;
  @Input({ required: false }) showDetails = false;
  @Input({ required: false }) showBuyButton = false;
  @Output() buyClicked = new EventEmitter<void>();

  protected readonly ItemRarity = ItemRarity;
}
