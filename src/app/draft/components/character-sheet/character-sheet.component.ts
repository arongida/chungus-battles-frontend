import { Component, Input, effect } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { Player } from '../../../models/colyseus-schema/PlayerSchema';
import { Item } from '../../../models/colyseus-schema/ItemSchema';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TitleCasePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DecimalPipe } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { CharacterAvatarComponent } from './character-avatar/character-avatar.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-character-sheet',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    TitleCasePipe,
    MatIconModule,
    DecimalPipe,
    MatDividerModule,
    MatTooltipModule,
    MatExpansionModule,
    MatProgressBarModule,
    CharacterAvatarComponent,
    CommonModule
  ],
  templateUrl: './character-sheet.component.html',
  styleUrl: './character-sheet.component.scss',
})
export class CharacterSheetComponent {
  startingHP: number = 100;
  showExperience: boolean = false;

  constructor() {
    this.player = {} as Player;
  }

  @Input({ required: true }) player: Player;
  @Input({ required: false }) combat: boolean = false;
  @Input({ required: false }) enemy: boolean = false;

  ngOnInit() {
    this.startingHP = this.player.hp;
  }

  getAggregatedInventory(): { name: string; quantity: number; image: string }[] {
    if (!this.player || !this.player.inventory) {
      return [];
    }
  
    const itemMap = new Map<string, { quantity: number; image: string }>();
  
    // Aggregate items by name and count quantity
    this.player.inventory.forEach((item: Item) => {
      if (itemMap.has(item.name)) {
        const existing = itemMap.get(item.name)!;
        itemMap.set(item.name, { quantity: existing.quantity + 1, image: item.image });
      } else {
        itemMap.set(item.name, { quantity: 1, image: item.image });
      }
    });
  
    // Convert the map to an array for easier rendering
    const aggregatedInventory: { name: string; quantity: number; image: string }[] = [];
    itemMap.forEach((value, name) => {
      aggregatedInventory.push({ name, quantity: value.quantity, image: value.image });
    });
  
    return aggregatedInventory;
  }
  

  getItemImage(item: { image: string }): string {
    return item.image || 'https://chungus-battles.b-cdn.net/chungus-battles-assets/Item_ID_0_Empty.png';
  }
}
