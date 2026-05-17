import { AfterViewChecked, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { CombatLogEntry } from '../../../models/types/CombatLogEntry';
import { Player } from '../../../models/colyseus-schema/PlayerSchema';
import { CombatLogHoverCardDirective } from '../../../common/directives/combat-log-hover-card.directive';

@Component({
  selector: 'app-combat-log',
  standalone: true,
  imports: [CombatLogHoverCardDirective],
  templateUrl: './combat-log.component.html',
  styleUrl: './combat-log.component.scss',
})
export class CombatLogComponent implements AfterViewChecked {
  @Input({ required: true }) entries: CombatLogEntry[] = [];
  @Input({ required: true }) player!: Player;
  @Input({ required: true }) enemy!: Player;

  @ViewChild('scroll') private scrollEl!: ElementRef<HTMLDivElement>;

  private lastLength = 0;

  ngAfterViewChecked() {
    if (this.entries.length !== this.lastLength) {
      this.lastLength = this.entries.length;
      this.scrollToBottom();
    }
  }

  private scrollToBottom() {
    try {
      this.scrollEl.nativeElement.scrollTop = this.scrollEl.nativeElement.scrollHeight;
    } catch { /* noop during SSR */ }
  }
}
