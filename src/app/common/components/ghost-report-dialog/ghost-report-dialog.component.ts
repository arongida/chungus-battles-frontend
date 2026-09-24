import { Component, Inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { GhostReportService, GhostReportSummary, InboxEncounter } from '../../services/ghost-report.service';
import { EMOTES, emoteIcon } from '../../social/emote-catalog';

export interface GhostReportDialogData {
  /** One character's report. Omit for the all-runs inbox (every run stored in this browser). */
  playerId?: number;
  name?: string;
}

/** "While you were away" — every recent fight this character's ghosts (or, in inbox mode, every
 *  stored character's ghosts) took part in, from the ghost's point of view. Opening it marks
 *  what it shows as seen. */
@Component({
  selector: 'app-ghost-report-dialog',
  standalone: true,
  imports: [MatDialogModule, RouterLink, DatePipe],
  templateUrl: './ghost-report-dialog.component.html',
  styleUrl: './ghost-report-dialog.component.scss',
})
export class GhostReportDialogComponent {
  report = signal<{ encounters: InboxEncounter[]; summary: GhostReportSummary } | null>(null);
  readonly inbox: boolean;
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
    this.inbox = data.playerId == null;
    this.load();
  }

  private async load(): Promise<void> {
    const svc = this.ghostReportService;
    if (this.data.playerId != null) {
      const playerId = this.data.playerId;
      const report = await svc.fetchReport(playerId);
      this.loading.set(false);
      if (!report) { this.failed.set(true); return; }
      const encounters = report.encounters.map(e => ({ ...e, ownerPlayerId: playerId, ownerName: this.data.name ?? '' }));
      encounters.forEach(e => { if (svc.isUnseen(playerId, e)) this.unseen.add(e.replayId); });
      this.report.set({ encounters, summary: report.summary });
      svc.markSeen(playerId, report);
      return;
    }
    const inbox = await svc.fetchInbox();
    this.loading.set(false);
    if (!inbox) { this.failed.set(true); return; }
    inbox.encounters.forEach(e => { if (svc.isUnseen(e.ownerPlayerId, e)) this.unseen.add(e.replayId); });
    this.report.set(inbox);
    inbox.reports.forEach((report, playerId) => svc.markSeen(playerId, report));
  }

  close(): void {
    this.dialogRef.close();
  }

  isNew(e: InboxEncounter): boolean {
    return this.unseen.has(e.replayId);
  }

  resultLabel(e: InboxEncounter): string {
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
