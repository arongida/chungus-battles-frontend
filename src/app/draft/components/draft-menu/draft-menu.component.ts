import { Component } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { DraftService } from '../../services/draft.service';
import { FightService } from '../../../fight/services/fight.service';
@Component({
  selector: 'app-draft-menu',
  standalone: true,
  imports: [MatButton],
  templateUrl: './draft-menu.component.html',
  styleUrl: './draft-menu.component.css'
})
export class DraftMenuComponent {
  constructor(private draftService: DraftService, private fightService: FightService) { }

  public startFight() {
    this.draftService.leave(false);
    const playerId = this.draftService.playerId;
    this.fightService.joinOrCreate(playerId);
  }
}
