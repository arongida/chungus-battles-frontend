import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FightStatsTableComponent } from '../fight-stats-table/fight-stats-table.component';
import { FightStatsMessage } from '../../../models/types/MessageTypes';

export interface FightStatsDialogData {
  playerName: string;
  enemyName: string;
  stats: FightStatsMessage;
}

/**
 * Per-fight stats breakdown, opened via MatDialog from a replay row's Stats button
 * (see replays-dialog.component.ts / end.component.ts openStats()).
 */
@Component({
  selector: 'app-fight-stats-dialog',
  standalone: true,
  imports: [MatDialogModule, FightStatsTableComponent],
  templateUrl: './fight-stats-dialog.component.html',
  styleUrl: './fight-stats-dialog.component.scss',
})
export class FightStatsDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: FightStatsDialogData,
    private dialogRef: MatDialogRef<FightStatsDialogComponent>,
  ) {}

  close(): void {
    this.dialogRef.close();
  }
}
