import { Component, Input } from '@angular/core';
import { Player } from '../../../models/colyseus-schema/PlayerSchema';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DecimalPipe } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider';
import { NgClass } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-character-details',
  standalone: true,
  imports: [MatProgressBarModule, MatTooltipModule, DecimalPipe, MatDividerModule, NgClass],
  templateUrl: './character-details.component.html',
  styleUrl: './character-details.component.scss',
})
export class CharacterDetailsComponent {
  @Input({ required: true }) player: Player = new Player();
  @Input() enemy: boolean = false;
  @Input() combat: boolean = false;

  constructor() {}

  getAvatarImage(): string {
    let avatar =
      this.player?.avatarUrl ||
      'https://chungus-battles.b-cdn.net/chungus-battles-assets/Portrait_ID_0_Placeholder.png';
    if (this.enemy) avatar = avatar.replace('.png', '_enemy.png');
    return avatar;
  }

  getPlayerHp(): number {
    return this.player.hp > 0 && this.player.hp < 1 ? 1 : this.player.hp;
  }
}
