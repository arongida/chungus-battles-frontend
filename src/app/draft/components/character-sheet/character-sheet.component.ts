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

@Component({
  selector: 'app-character-sheet',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatProgressBarModule, NgIf, MatIconModule, DecimalPipe, MatDividerModule],
  templateUrl: './character-sheet.component.html',
  styleUrl: './character-sheet.component.css'
})
export class CharacterSheetComponent {

  talentsString: string;

  constructor(public draftService: DraftService) {
    this.player = {} as Player;
    this.talentsString = "";

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

  getTalentsString(): string {
    let talentsString = "";
    if (this.player.talents) {
      for (let i = 0; i < this.player.talents.length; i++) {
        talentsString += this.player.talents[i].name + " ";
      }
    }
    return talentsString;
  }
}
