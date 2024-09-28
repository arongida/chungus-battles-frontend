import { Component, Input } from '@angular/core';
import { Player } from '../../../models/colyseus-schema/PlayerSchema';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-talent-icons',
  standalone: true,
  imports: [MatTooltipModule],
  templateUrl: './talent-icons.component.html',
  styleUrl: './talent-icons.component.scss',
})
export class TalentIconsComponent {
  @Input({ required: true }) player: Player = new Player();
}
