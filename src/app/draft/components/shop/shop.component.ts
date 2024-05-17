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

  toggleBuyButton(elId: string) {
    let buyButton = document.getElementById("buy-" + elId);
    if (buyButton) {
      if (buyButton.style.display === "none") {
        buyButton.style.display = "block";
      } else {
        buyButton.style.display = "none";
      }
    }
  }

  getTooltip(item: Item): string {
    const tooltip = `Cost: ${item.price} 
    Attack: ${item.affectedStats.attack} 
    Defense: ${item.affectedStats.defense} 
    Health: ${item.affectedStats.hp} 
    Attack Speed: ${item.affectedStats.attackSpeed} 
    Level: ${item.levelRequirement} 

    Description: ${item.description}`;
    return tooltip;
  }

  getItemImage(item: Item): string {
    return item.image ? item.image : 'https://chungus-battles.b-cdn.net/chungus-battles-assets/Item_ID_21_Cloak_of_Invisibility.png';
  }

}
