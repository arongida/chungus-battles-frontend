import { Component, Input, inject } from '@angular/core';
import { Player } from '../../../models/colyseus-schema/PlayerSchema';
import { DraftService } from '../../../draft/services/draft.service';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NgClass } from '@angular/common';
import { Talent } from '../../../models/colyseus-schema/TalentSchema';
import { MatDialog } from '@angular/material/dialog';
import { TalentsComponent } from '../../../draft/components/talents/talents.component';

@Component({
  selector: 'app-character-avatar',
  standalone: true,
  imports: [
    MatProgressBarModule,
    MatTooltipModule,
    MatButtonModule,
    MatIconModule,
    NgClass,
  ],
  templateUrl: './character-avatar.component.html',
  styleUrl: './character-avatar.component.scss',
})
export class CharacterAvatarComponent {
  hoverExperience = false;
  talentDialog = inject(MatDialog);

  constructor(public draftService: DraftService) {
    this.player = {} as Player;
  }

  @Input({ required: true }) player: Player;
  @Input({ required: false }) combat: boolean = false;
  @Input({ required: false }) enemy: boolean = false;
  @Input({ required: true }) showExperience: boolean = false;
  @Input({ required: false }) availableTalents: Talent[] = [];


  onAvatarMouseEnter() {
    this.showExperience = !this.combat ? true : false;
    console.log('talents', this.availableTalents);
  }

  onAvatarMouseLeave() {
    this.showExperience = false;
  }

  getAvatarImage(): string {
    let avatar =
      this.player?.avatarUrl ||
      'https://chungus-battles.b-cdn.net/chungus-battles-assets/Portrait_ID_0_Placeholder.png';
    if (this.enemy) avatar = avatar.replace('.png', '_enemy.png');
    return avatar;
  }

  switchHoverExperience() {
    this.hoverExperience = !this.hoverExperience;
  }
}
