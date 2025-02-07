import { Component, Input } from '@angular/core';
import { Player } from '../../../models/colyseus-schema/PlayerSchema';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DecimalPipe } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider';
import { NgClass } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Item } from '../../../models/colyseus-schema/ItemSchema';
import { MatCardContent } from '@angular/material/card';
import { ItemCardComponent } from '../../item-card/item-card.component';
import { DraftService } from '../../../draft/services/draft.service';
import { MatButtonModule } from '@angular/material/button';

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
  ],
  templateUrl: './character-details.component.html',
  styleUrl: './character-details.component.scss',
})
export class CharacterDetailsComponent {
  @Input({ required: true }) player: Player = new Player();
  @Input() enemy: boolean = false;
  @Input() combat: boolean = false;
  selectedCategory : string = "all";

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
    item.image = `https://chungus-battles.b-cdn.net/chungus-battles-assets/level_${item.tier}_glow.png`;
  }

  onMouseLeaveItem(item: Item) {
    item.showDetails = false;
    item.image = item.imageCache!;
  }

  getItem(type: string) {
    return this.player.inventory.find((item) => item.type === type) ?? new Item();
  }

  getMissingEquipmentSlots(): string[] {
    const slots = ['weapon', 'armor', 'helmet', 'shield'];
    const equippedSlots = this.player.equippedItems.map((item) => item.type);
    console.log(equippedSlots);
    let missingSlots: string[] = [];
    slots.forEach((slot) => {
      if (!equippedSlots.includes(slot)) {
        missingSlots.push(slot);
      }
    });
    console.log(missingSlots);  
    return missingSlots;
  }

  selectCategory(category: string){
    this.selectedCategory = category;
    console.log(this.selectedCategory);
  }

  getEquipmentTypeFromInventory(itemType : string): Item[] {
    if(itemType === "all"){
      return this.player.inventory as unknown as Item[];
    }else{
      return this.player.inventory.filter(item => item.type === itemType);
    }
  }

  sellSelectedItem(item: Item) {
    this.draftService.sendMessage('sell', {
      itemId: item.itemId
    });
  }

  equip(item: Item){
    this.draftService.sendMessage('equip', {
      itemId: item.itemId
    });
  }

  unequip(item: Item){
    this.draftService.sendMessage('unequip', {
      itemId: item.itemId
    });
  }
}
