import { Component, Input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button'
//import { Player } from '../../../models/player';
import { Player } from '../../../models/colyseus-schema/PlayerSchema'
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DraftService } from '../../services/draft.service';
import { NgIf } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DecimalPipe } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';

@Component({
  selector: 'app-character-sheet',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatProgressBarModule, NgIf, MatIconModule, DecimalPipe, MatDividerModule, MatTooltipModule, MatExpansionModule],
  templateUrl: './character-sheet.component.html',
  styleUrl: './character-sheet.component.css'
})
export class CharacterSheetComponent {

  constructor(public draftService: DraftService) {
    this.player = {} as Player;

  }
  @Input({ required: true }) player: Player;
  @Input({ required: false }) combat: boolean = false;


  getLivesString(): string {
    let lives = "";
    for (let i = 0; i < this.player.lives; i++) {
      lives += "♥️ ";
    }
    return lives;
  }

}
