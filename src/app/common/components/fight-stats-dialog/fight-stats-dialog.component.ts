import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { FightStatsTableComponent } from '../fight-stats-table/fight-stats-table.component';
import { FightStatsMessage } from '../../../models/types/MessageTypes';

export interface FightStatsDialogData {
  playerName: string;
  enemyName: string;
  stats: FightStatsMessage;
  subtitle?: string;
  // Only set from the match-history list (replays-dialog / end.component) — the stats popup
  // opened from a live-fight result screen deliberately omits it, so those screens stay
  // stat-only and don't re-offer the replay they were just shown from.
  replayId?: string;
}

/**
 * Per-fight stats breakdown, opened via MatDialog from a replay row's Stats button
 * (see replays-dialog.component.ts / end.component.ts openStats()).
 */
@Component({
  selector: 'app-fight-stats-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, RouterLink, FightStatsTableComponent],
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
