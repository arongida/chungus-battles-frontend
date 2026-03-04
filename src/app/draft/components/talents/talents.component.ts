import { Component, Inject, OnDestroy, signal } from '@angular/core';
import { Talent } from '../../../models/colyseus-schema/TalentSchema';
import { MatCardModule } from '@angular/material/card';
import { DraftService } from '../../services/draft.service';
import { MatButtonModule } from '@angular/material/button';
import { NgClass } from '@angular/common';
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
    MatTooltipModule,
    MatIconModule,
    NgClass,
  ],
  templateUrl: './talents.component.html',
  styleUrl: './talents.component.scss',
})
export class TalentsComponent implements OnDestroy {
  hoverTelentRefresh = false;
  talents = signal<Talent[]>([]);
  talentRerollCost = signal<number>(0);

  private stateCallback: ((state: any) => void) | undefined;

  constructor(
    public draftService: DraftService,
    @Inject(MAT_DIALOG_DATA)
    public data: { talents: Talent[] },
    public dialogRef: MatDialogRef<TalentsComponent>,
    private soundsService: SoundsService
  ) {
    this.talents.set(data.talents);

    this.stateCallback = (state: any) => {
      this.talentRerollCost.set(state.talentRerollCost ?? 0);
    };
    this.draftService.room?.onStateChange(this.stateCallback);
  }

  ngOnDestroy() {
    if (this.stateCallback) {
      (this.draftService.room?.onStateChange as any).remove?.(this.stateCallback);
    }
  }

  getTalentImage(talent: Talent) {
    return talent.image
      ? talent.image
      : 'assets/talent_tablet_01_horizontal.png';
  }

  onMouseEnterTalent(talent: Talent) {
    talent.showDetails = true;
    talent.imageCache = talent.image;
    talent.image =
      'assets/talent_tablet_01_horizontal.png';
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
