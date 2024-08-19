import { Component, Input } from '@angular/core';
import { Player } from '../../../../models/colyseus-schema/PlayerSchema';
import { DraftService } from '../../../services/draft.service';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButton } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-character-avatar',
  standalone: true,
  imports: [
    MatProgressBarModule,
    MatTooltipModule,
    MatButton,
    MatIconModule,
    NgClass,
  ],
  templateUrl: './character-avatar.component.html',
  styleUrl: './character-avatar.component.scss',
})
export class CharacterAvatarComponent {
  hoverExperience = false;

  constructor(public draftService: DraftService) {
    this.player = {} as Player;
  }

  @Input({ required: true }) player: Player;
  @Input({ required: false }) combat: boolean = false;
  @Input({ required: false }) enemy: boolean = false;
  @Input({ required: true }) showExperience: boolean = false;

  onAvatarMouseEnter() {
    this.showExperience = !this.combat ? true : false;
  }

  onAvatarMouseLeave() {
    this.showExperience = false;
  }

  getAvatarImage(): string {
    let avatar =
      this.player?.avatarUrl ||
      'https://chungus-battles.b-cdn.net/chungus-battles-assets/Portrait_ID_0_Placeholder.png';
    if (this.enemy) avatar = avatar.replace('.png', '_enemy.png');
    const empty =
      'https://chungus-battles.b-cdn.net/chungus-battles-assets/Item_ID_0_Empty.png';
    return this.showExperience ? empty : avatar;
  }

  switchHoverExperience() {
    this.hoverExperience = !this.hoverExperience;
  }
}
