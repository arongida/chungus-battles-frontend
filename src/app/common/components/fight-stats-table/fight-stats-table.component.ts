import { Component, Input } from '@angular/core';
import { FightStatsMessage } from '../../../models/types/MessageTypes';

@Component({
  selector: 'app-fight-stats-table',
  standalone: true,
  templateUrl: './fight-stats-table.component.html',
  styleUrl: './fight-stats-table.component.scss',
})
export class FightStatsTableComponent {
  @Input({ required: true }) playerName!: string;
  @Input({ required: true }) enemyName!: string;
  @Input({ required: true }) stats!: FightStatsMessage;

  fmt(v: number): string {
    return parseFloat(v.toFixed(0)).toString();
  }
}
