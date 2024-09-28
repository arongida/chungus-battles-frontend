import { Component, Input } from '@angular/core';
import { Player } from '../../../models/colyseus-schema/PlayerSchema';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-skill-icons',
  standalone: true,
  imports: [MatTooltipModule],
  templateUrl: './skill-icons.component.html',
  styleUrl: './skill-icons.component.scss',
})
export class SkillIconsComponent {
  @Input({ required: true }) player: Player = new Player();
}
