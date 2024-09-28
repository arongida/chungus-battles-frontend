import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { DraftService } from '../../services/draft.service';
import { FightService } from '../../../fight/services/fight.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
@Component({
  selector: 'app-draft-menu',
  standalone: true,
  imports: [MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './draft-menu.component.html',
  styleUrl: './draft-menu.component.scss',
})
export class DraftMenuComponent {
  loading = false;
  constructor(
    private draftService: DraftService,
    private fightService: FightService
  ) {}

  async startFight() {
    if (this.loading) return;
    this.loading = true;
    const playerId = localStorage.getItem('playerId');
    if (!playerId) return;
    await this.draftService.leave(false);
    await this.fightService.joinOrCreate(parseInt(playerId));
    this.loading = false;
  }
}
