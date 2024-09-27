import { Component, Inject, Input } from '@angular/core';
import { Player } from '../../../models/colyseus-schema/PlayerSchema';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DecimalPipe } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-character-details',
  standalone: true,
  imports: [MatTooltipModule, DecimalPipe, MatDividerModule],
  templateUrl: './character-details.component.html',
  styleUrl: './character-details.component.scss',
})
export class CharacterDetailsComponent {
  player: Player;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { player: Player }
  ) {
    this.player = data.player;
  }

  getAvatarImage(): string {
    let avatar =
      this.player?.avatarUrl ||
      'https://chungus-battles.b-cdn.net/chungus-battles-assets/Portrait_ID_0_Placeholder.png';
    return avatar;
  }
}
