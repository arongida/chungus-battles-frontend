import { Component, Input, effect } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { Player } from '../../../models/colyseus-schema/PlayerSchema';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { NgIf } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DecimalPipe } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { CharacterAvatarComponent } from './character-avatar/character-avatar.component';

@Component({
  selector: 'app-character-sheet',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    NgIf,
    MatIconModule,
    DecimalPipe,
    MatDividerModule,
    MatTooltipModule,
    MatExpansionModule,
    MatProgressBarModule,
    CharacterAvatarComponent,
  ],
  templateUrl: './character-sheet.component.html',
  styleUrl: './character-sheet.component.css',
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
}
