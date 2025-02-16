import { Component, Input } from '@angular/core';
import { Player } from '../../../models/colyseus-schema/PlayerSchema';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DecimalPipe, TitleCasePipe } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider';
import { NgClass } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Item } from '../../../models/colyseus-schema/ItemSchema';
import { MatCardContent } from '@angular/material/card';
import { ItemCardComponent } from '../../item-card/item-card.component';
import { DraftService } from '../../../draft/services/draft.service';
import { MatButtonModule } from '@angular/material/button';
import {MatTabChangeEvent, MatTabsModule} from '@angular/material/tabs';


@Component({
  selector: 'app-character-details',
  standalone: true,
  imports: [
    MatProgressBarModule,
    MatTooltipModule,
    DecimalPipe,
    MatDividerModule,
    NgClass,
    MatButtonModule,
    MatCardContent,
    ItemCardComponent,
    TitleCasePipe,
    MatTabsModule
  ],
  templateUrl: './character-details.component.html',
  styleUrl: './character-details.component.scss',
})
export class CharacterDetailsComponent {
  @Input({ required: true }) player: Player = new Player();
  @Input() enemy: boolean = false;
  @Input() combat: boolean = false;
  selectedCategory: string = "inventory";

  constructor(public draftService: DraftService) {

  }


  getAvatarImage(): string {
    let avatar =
      this.player?.avatarUrl ||
      'https://chungus-battles.b-cdn.net/chungus-battles-assets/Portrait_ID_0_Placeholder.png';
    if (this.enemy) avatar = avatar.replace('.png', '_enemy.png');
    return avatar;
  }

  getPlayerHp(): number {
    return this.player.hp > 0 && this.player.hp < 1 ? 1 : this.player.hp;
  }

  onMouseEnterItem(item: Item) {
    item.showDetails = true;
    item.imageCache = item.image;
    item.image = `https://chungus-battles.b-cdn.net/chungus-battles-assets/level_${item.tier < 10 ? item.tier : item.tier - 90}_glow.png`;
    console.log(item.tier);
  }

  onMouseLeaveItem(item: Item) {
    if (!item.showDetails) return;
    item.showDetails = false;
    item.image = item.imageCache!;
  }

  getItem(type: string) {
    return this.player.inventory.find((item) => item.type === type) ?? new Item();
  }

  getMissingEquipmentSlots(): string[] {
    const slots = ['weapon', 'armor', 'helmet', 'shield'];
    const equippedSlots = this.player.equippedItems.map((item) => item.type);
    let missingSlots: string[] = [];
    slots.forEach((slot) => {
      if (!equippedSlots.includes(slot)) {
        missingSlots.push(slot);
      }
    });
    return missingSlots;
  }

  selectCategory(event: MatTabChangeEvent) {
    const categoryName = event.tab.textLabel.toLocaleLowerCase().substring(0,event.tab.textLabel.length -1);
    if(categoryName === "al"){
      this.selectedCategory = "inventory";
    }else{
      this.selectedCategory = categoryName;
    }
    console.log(this.selectedCategory);
  }

  onTabChange(event: MatTabChangeEvent){
    this.selectedCategory = event.tab.textLabel.toLocaleLowerCase();

    console.log('Selected Tab:', this.selectedCategory);
  }

  getEquipmentTypeFromInventory(itemType: string): Item[] {
    if (itemType === "inventory") {
      return this.player.inventory as unknown as Item[];
    } else if (itemType === "equipped") {
      return this.player.equippedItems as unknown as Item[];
    }
    else {
      return this.player.inventory.filter(item => item.type === itemType);
    }
  }

  sellSelectedItem(item: Item) {
    this.draftService.sendMessage('sell', {
      itemId: item.itemId
    });
    this.onMouseLeaveItem(item);
  }

  equip(item: Item) {
    this.draftService.sendMessage('equip', {
      itemId: item.itemId
    });
    this.onMouseLeaveItem(item);
  }

  unequip(item: Item) {
    this.draftService.sendMessage('unequip', {
      itemId: item.itemId
    });
    this.onMouseLeaveItem(item);
  }

  getItemPriceRounded(item: Item) {
    return Math.floor(item.price * 0.7);
  }

  getItemBackground(item: Item) {
    return `https://chungus-battles.b-cdn.net/chungus-battles-assets/level_${item.tier}_glow.png`;
  }
}
