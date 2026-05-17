import { Component, Input } from '@angular/core';
import { Player } from '../../../models/colyseus-schema/PlayerSchema';
import { MatIconModule } from '@angular/material/icon';
import { TalentHoverCardDirective } from '../../directives/talent-hover-card.directive';

@Component({
  selector: 'app-skill-icons',
  standalone: true,
  imports: [MatIconModule, TalentHoverCardDirective],
  templateUrl: './skill-icons.component.html',
  styleUrl: './skill-icons.component.scss',
})
export class SkillIconsComponent {
  @Input({ required: true }) player: Player = new Player();
  @Input() row = false;
}
