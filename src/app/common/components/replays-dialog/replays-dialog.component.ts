import { Component, Inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { ReplaysService } from '../../services/replays.service';
import { ReplayListItem } from '../../../replay/replay-room.component';

export interface ReplaysDialogData {
  originalPlayerId: number;
}

/**
 * "My Fight Replays" list, opened via MatDialog (see draft-toolbar.component.ts openReplays())
 * so it renders in the CDK overlay instead of being capped by the toolbar's own stacking context.
 */
@Component({
  selector: 'app-replays-dialog',
  standalone: true,
  imports: [MatDialogModule, MatIconModule, RouterLink, DatePipe],
  templateUrl: './replays-dialog.component.html',
  styleUrl: './replays-dialog.component.scss',
})
export class ReplaysDialogComponent {
  replays = signal<ReplayListItem[]>([]);
  replaysLoading = signal(true);

  constructor(
    @Inject(MAT_DIALOG_DATA) data: ReplaysDialogData,
    private dialogRef: MatDialogRef<ReplaysDialogComponent>,
    private replaysService: ReplaysService,
  ) {
    this.replaysService.getReplays(data.originalPlayerId).then(list => {
      this.replays.set(list);
      this.replaysLoading.set(false);
    });
  }

  close(): void {
    this.dialogRef.close();
  }

  replayResultLabel(result: string): string {
    if (result === 'win') return '⚔️ Win';
    if (result === 'lose' || result === 'loose') return '🛡️ Loss';
    return '⚡ Draw';
  }
}
