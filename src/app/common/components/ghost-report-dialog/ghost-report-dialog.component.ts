import { Component, Inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { GhostEncounter, GhostReport, GhostReportService } from '../../services/ghost-report.service';
import { EMOTES, emoteIcon } from '../../social/emote-catalog';

export interface GhostReportDialogData {
  playerId: number;
  name?: string;
}

/** "While you were away" — every recent fight this character's ghosts took part in, from the
 *  ghost's point of view. Opening it marks the whole report as seen for this run. */
@Component({
  selector: 'app-ghost-report-dialog',
  standalone: true,
  imports: [MatDialogModule, RouterLink, DatePipe],
  templateUrl: './ghost-report-dialog.component.html',
  styleUrl: './ghost-report-dialog.component.scss',
})
export class GhostReportDialogComponent {
  report = signal<GhostReport | null>(null);
  loading = signal(true);
  failed = signal(false);
  /** Snapshot of which rows were unseen when the dialog opened (markSeen runs right after). */
  private unseen = new Set<string>();
  readonly emotes = EMOTES;
  readonly emoteIcon = emoteIcon;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: GhostReportDialogData,
    private dialogRef: MatDialogRef<GhostReportDialogComponent>,
    private ghostReportService: GhostReportService,
  ) {
    this.ghostReportService.fetchReport(data.playerId).then(report => {
      this.loading.set(false);
      if (!report) { this.failed.set(true); return; }
      report.encounters.forEach(e => { if (this.ghostReportService.isUnseen(data.playerId, e)) this.unseen.add(e.replayId); });
      this.report.set(report);
      this.ghostReportService.markSeen(data.playerId, report);
    });
  }

  close(): void {
    this.dialogRef.close();
  }

  isNew(e: GhostEncounter): boolean {
    return this.unseen.has(e.replayId);
  }

  resultLabel(e: GhostEncounter): string {
    if (e.result === 'win') return e.endedRun ? '💀 Ended their run' : '⚔️ Your ghost won';
    if (e.result === 'lose') return '🛡️ Your ghost lost';
    return '⚡ Draw';
  }

  emoteTotals(): { id: string; count: number }[] {
    const totals = this.report()?.summary.emotes ?? {};
    return Object.entries(totals).map(([id, count]) => ({ id, count })).sort((a, b) => b.count - a.count);
  }

  avatar(url: string): string {
    return url || 'assets/Portrait_ID_0_Placeholder.png';
  }
}
