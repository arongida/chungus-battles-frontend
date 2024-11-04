import { Component, Inject, Input } from '@angular/core';
import { Player } from '../../../models/colyseus-schema/PlayerSchema';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DecimalPipe } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CharacterDetailsComponent } from '../character-details/character-details.component';

@Component({
  selector: 'app-character-details-dialog',
  standalone: true,
  imports: [MatTooltipModule, DecimalPipe, MatDividerModule, CharacterDetailsComponent],
  templateUrl: './character-details-dialog.component.html',
  styleUrl: './character-details-dialog.component.scss',
})
export class CharacterDetailsDialogComponent {
  player: Player;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { player: Player }
  ) {
    this.player = data.player;
  }
}
