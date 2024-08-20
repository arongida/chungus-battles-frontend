import { Component, Input, effect } from '@angular/core';

@Component({
  selector: 'app-combat-log',
  standalone: true,
  imports: [],
  templateUrl: './combat-log.component.html',
  styleUrl: './combat-log.component.scss',
})
export class CombatLogComponent {
  @Input({ required: true }) combatLog: string = '';
}
