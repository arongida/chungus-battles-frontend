import { Component, Inject, Input } from '@angular/core';
import { Talent } from '../../../models/colyseus-schema/TalentSchema';
import { MatCardModule } from '@angular/material/card';
import { DraftService } from '../../services/draft.service';
import { MatButtonModule } from '@angular/material/button';
import { MatChip } from '@angular/material/chips';
import { NgClass, SlicePipe } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SoundOptions, SoundsService } from '../../../common/services/sounds.service';

@Component({
  selector: 'app-talents',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    SlicePipe,
    MatTooltipModule,
    MatChip,
    MatIconModule,
    NgClass,
  ],
  templateUrl: './talents.component.html',
  styleUrl: './talents.component.scss',
})
export class TalentsComponent {
  hoverTelentRefresh = false;
  talents: Talent[];
  playerLevel: number;

  constructor(
    public draftService: DraftService,
    @Inject(MAT_DIALOG_DATA)
    public data: { talents: Talent[]; playerLevel: number },
    public dialogRef: MatDialogRef<TalentsComponent>,
    private soundsService: SoundsService
  ) {
    this.talents = data.talents;
    this.playerLevel = data.playerLevel;
  }

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

  switchTalentRefreshAnimate() {
    this.hoverTelentRefresh = !this.hoverTelentRefresh;
  }

  selectTalent(talentId: number) {
    this.draftService.sendMessage('select_talent', {
      talentId: talentId,
    });
    this.dialogRef.close();
  }

  closeDialog() {
    this.dialogRef.close();
  }

  refreshTalents() {
    this.soundsService.playSound(SoundOptions.CLICK);
    this.draftService.sendMessage('refresh_talents', {})
  }
}
