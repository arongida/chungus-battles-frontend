import { Component, Input } from '@angular/core';
import { Talent } from '../../../models/colyseus-schema/TalentSchema';
import { MatCardModule } from '@angular/material/card';
import { DraftService } from '../../services/draft.service';
import { MatButtonModule } from '@angular/material/button';
import { MatChip } from '@angular/material/chips';
import { SlicePipe } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-talents',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    SlicePipe,
    MatTooltipModule,
    MatChip,
  ],
  templateUrl: './talents.component.html',
  styleUrl: './talents.component.scss',
})
export class TalentsComponent {
  constructor(public draftService: DraftService) {
    this.talents = [] as Talent[];
  }

  @Input({ required: true }) talents: Talent[];

  getTalentImage(talent: Talent) {
    return talent.image
      ? talent.image
      : 'https://chungus-battles.b-cdn.net/chungus-battles-assets/talent_tablet_01_horizontal.png';
  }

  onMouseEnterTalent(talent: Talent) {
    talent.showDetails = true;
    talent.imageCache = talent.image;
    talent.image =
      'https://chungus-battles.b-cdn.net/chungus-battles-assets/talent_tablet_01_horizontal.png';
  }

  onMouseLeaveTalent(talent: Talent) {
    talent.showDetails = false;
    talent.image = talent.imageCache!;
  }
}
