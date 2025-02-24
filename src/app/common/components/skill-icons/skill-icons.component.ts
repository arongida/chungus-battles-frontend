import { Component, Input } from '@angular/core';
import { Player } from '../../../models/colyseus-schema/PlayerSchema';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-skill-icons',
  standalone: true,
  imports: [MatTooltipModule, MatIconModule],
  templateUrl: './skill-icons.component.html',
  styleUrl: './skill-icons.component.scss',
})
export class SkillIconsComponent {
  @Input({ required: true }) player: Player = new Player();
}
