import { Component, Input } from '@angular/core';
import { Player } from '../../../models/colyseus-schema/PlayerSchema';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Talent } from '../../../models/colyseus-schema/TalentSchema';

@Component({
  selector: 'app-character-avatar',
  standalone: true,
  imports: [
    MatProgressBarModule,
    MatTooltipModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './character-avatar.component.html',
  styleUrl: './character-avatar.component.scss',
})
export class CharacterAvatarComponent {

  constructor() {
    this.player = {} as Player;
  }

  @Input({ required: true }) player: Player;
  @Input({ required: false }) combat: boolean = false;
  @Input({ required: false }) enemy: boolean = false;
  @Input({ required: true }) showExperience: boolean = false;
  @Input({ required: false }) availableTalents: Talent[] = [];
  @Input({ required: false }) isBeingHit: boolean = false;

  getAvatarImage(): string {
    let avatar =
      this.player?.avatarUrl ||
      'https://chungus-battles.b-cdn.net/chungus-battles-assets/Portrait_ID_0_Placeholder.png';


    if (this.isBeingHit) {
      // Logic for when the component has the 'cringe' class
      return avatar.replace('.png', '_cringe.png'); // Or your desired image
    }

    if (this.enemy) {
      avatar = avatar.replace('.png', '_enemy.png');
    }

    return avatar;
  }
}
