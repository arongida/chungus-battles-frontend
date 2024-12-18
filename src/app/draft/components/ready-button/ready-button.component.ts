import { Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { DraftService } from '../../services/draft.service';
import { FightService } from '../../../fight/services/fight.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Talent } from '../../../models/colyseus-schema/TalentSchema';
import { SoundOptions, SoundsService } from '../../../common/services/sounds.service';
@Component({
  selector: 'app-ready-button',
  standalone: true,
  imports: [MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './ready-button.component.html',
  styleUrl: './ready-button.component.scss',
})
export class ReadyButtonComponent {
  loading = false;
  
  constructor(
    private draftService: DraftService,
    private fightService: FightService,
    private soundsService: SoundsService
  ) {}

  @Input({ required: false })
  availableTalents: Talent[] = [];
  
  async startFight() {
    this.soundsService.playSound(SoundOptions.CLICK);
    if (this.loading) return;
    this.loading = true;
    const playerId = localStorage.getItem('playerId');
    if (!playerId) return;
    await this.draftService.leave(false);
    await this.fightService.joinOrCreate(parseInt(playerId));
    this.loading = false;
  }
}
