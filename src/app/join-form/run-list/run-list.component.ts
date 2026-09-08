import { Component, EventEmitter, Inject, OnInit, Output, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { RunRegistryService } from '../../common/services/run-registry.service';
import { RunSummariesService } from '../../common/services/run-summaries.service';
import { SeasonsService } from '../../common/services/seasons.service';
import { ConfirmDialogComponent } from '../../common/components/confirm-dialog/confirm-dialog.component';
import { RunRecord } from '../../common/models/run-record';

/** "Continue a run" list on the home screen — see RunRegistryService. Renders nothing when the
 *  registry is empty, so a first-time player's join screen is unchanged. */
@Component({
  selector: 'app-run-list',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './run-list.component.html',
  styleUrl: './run-list.component.scss',
})
export class RunListComponent implements OnInit {
  @Output() resume = new EventEmitter<number>();

  runs = this.runRegistry.runs;
  refreshing = signal(false);
  currentSeason = signal(0);

  constructor(
    private runRegistry: RunRegistryService,
    private runSummariesService: RunSummariesService,
    private seasonsService: SeasonsService,
    private dialog: MatDialog,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.seasonsService.getSeasons().then((data) => this.currentSeason.set(data.currentSeason));
    this.refreshing.set(true);
    this.runSummariesService.refreshAll().finally(() => this.refreshing.set(false));
  }

  isEnded(run: RunRecord): boolean {
    return run.status === 'ended' || (run.summary?.lives ?? 1) <= 0;
  }

  isOldSeason(run: RunRecord): boolean {
    return !!run.summary && this.currentSeason() > 0 && run.summary.gameVersion < this.currentSeason();
  }

  livesPips(run: RunRecord): number[] {
    return Array.from({ length: Math.max(0, run.summary?.lives ?? 0) });
  }

  /** Only meaningful now that the backend actually enforces one live session per character (see
   *  claimPlayerSession) — before that fix this badge was structurally always false. */
  busyTooltip(run: RunRecord): string {
    return run.summary?.busyPhase === 'fight'
      ? 'Currently in a fight in another tab or window'
      : 'This run may still be connected in another tab';
  }

  onResume(run: RunRecord): void {
    if (this.isEnded(run)) return;
    this.resume.emit(run.playerId);
  }

  confirmDelete(run: RunRecord, event: Event): void {
    event.stopPropagation();
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          icon: '🗑️',
          title: 'Remove This Run?',
          body: `This permanently forgets ${run.name || 'this run'} — the server only keeps a one-way credential for it, so once removed here it can never be resumed again.`,
          cancelLabel: 'Keep It',
          confirmLabel: 'Remove',
          confirmDanger: true,
        },
        backdropClass: 'chungus-dialog-backdrop',
        autoFocus: false,
      })
      .afterClosed()
      .subscribe((ok) => {
        if (ok) this.runRegistry.removeRun(run.playerId);
      });
  }
}
