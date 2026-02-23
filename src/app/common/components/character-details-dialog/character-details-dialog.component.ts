import { Component, Inject } from '@angular/core';
import { Player } from '../../../models/colyseus-schema/PlayerSchema';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CharacterDetailsComponent } from '../character-details/character-details.component';
import { SkillIconsComponent } from '../skill-icons/skill-icons.component';

@Component({
  selector: 'app-character-details-dialog',
  standalone: true,
  imports: [MatTooltipModule, MatDividerModule, CharacterDetailsComponent, SkillIconsComponent],
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
