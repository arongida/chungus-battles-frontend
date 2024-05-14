import { Component, Input} from '@angular/core';
import { Talent } from '../../../models/colyseus-schema/TalentSchema';
import { MatCardModule } from '@angular/material/card';
import { DraftService } from '../../services/draft.service';
import { MatButtonModule } from '@angular/material/button';
import { SlicePipe } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-talents',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, SlicePipe, MatTooltipModule],
  templateUrl: './talents.component.html',
  styleUrl: './talents.component.css'
})
export class TalentsComponent {


  constructor(public draftService: DraftService) {
    this.talents = [] as Talent[];
  }

  @Input({ required: true }) talents: Talent[];
}
