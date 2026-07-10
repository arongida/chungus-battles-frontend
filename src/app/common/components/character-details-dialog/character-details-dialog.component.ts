import { Component, Inject } from '@angular/core';
import { Player } from '../../../models/colyseus-schema/PlayerSchema';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CharacterDetailsComponent } from '../character-details/character-details.component';
import { SkillIconsComponent } from '../skill-icons/skill-icons.component';

export interface CharacterDetailsDialogData {
  player: Player;
  /** Defaults to true. False hides the stats grid. */
  showStats?: boolean;
  /** Next-Enemy Preview: identity-only reveal — see CharacterDetailsComponent.redacted. */
  redacted?: boolean;
  /** Talent/item classes of the redacted next opponent (duplicates kept, ×N chips in UI). */
  talentClasses?: string[];
  itemClasses?: string[];
}

@Component({
  selector: 'app-character-details-dialog',
  standalone: true,
  imports: [MatTooltipModule, MatDividerModule, CharacterDetailsComponent, SkillIconsComponent],
  templateUrl: './character-details-dialog.component.html',
  styleUrl: './character-details-dialog.component.scss',
})
export class CharacterDetailsDialogComponent {
  player: Player;
  showStats: boolean;
  redacted: boolean;
  talentClasses: string[];
  itemClasses: string[];

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: CharacterDetailsDialogData
  ) {
    this.player = data.player;
    this.showStats = data.showStats ?? true;
    this.redacted = data.redacted ?? false;
    this.talentClasses = data.talentClasses ?? [];
    this.itemClasses = data.itemClasses ?? [];
  }
}
