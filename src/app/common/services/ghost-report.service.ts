import { computed, Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { RunRegistryService } from './run-registry.service';

export interface GhostEncounter {
  replayId: string;
  ownerSnapshotRound: number;
  opponentOriginalPlayerId: number;
  opponentName: string;
  opponentAvatarUrl: string;
  opponentIsBot?: boolean;
  /** From the ghost's point of view — 'win' means your ghost beat them. */
  result: 'win' | 'lose' | 'draw';
  /** Your ghost delivered their final loss. */
  endedRun: boolean;
  /** Preset reaction ids they sent (common/social/emote-catalog.ts). */
  emotes: string[];
  createdAt: string;
}

export interface GhostReportSummary {
  fights: number;
  wins: number;
  losses: number;
  draws: number;
  runsEnded: number;
  emotes: Record<string, number>;
}

export interface GhostReport {
  encounters: GhostEncounter[];
  summary: GhostReportSummary;
}

/** An encounter tagged with which of this browser's characters the ghost belonged to — the
 *  all-runs inbox (menu header) merges every run's report into one list. */
export interface InboxEncounter extends GhostEncounter {
  ownerPlayerId: number;
  ownerName: string;
}

/**
 * "While you were away" — how a character's ghosts (its matchmaking snapshots) did in other
 * players' fights. There are no accounts: each run's playerToken (from RunRegistryService)
 * proves this browser owns the character, and "seen" is tracked per run in the registry, so the
 * report only reaches the browser that created the run. See backend POST /ghostReport.
 */
@Injectable({ providedIn: 'root' })
export class GhostReportService {
  /** Unseen-encounter counts per run (playerId → n), shared by every badge (menu header, run
   *  list) so opening a report anywhere clears it everywhere. */
  readonly unseenCounts = signal<Map<number, number>>(new Map());
  readonly unseenTotal = computed(() => [...this.unseenCounts().values()].reduce((a, b) => a + b, 0));

  constructor(private runRegistry: RunRegistryService) {}

  /** Refreshes unseenCounts for every stored run (one request). */
  async refreshUnseenCounts(): Promise<void> {
    this.unseenCounts.set(await this.fetchUnseenCounts());
  }

  /** Every stored run's recent report merged into one newest-first list, with the summaries
   *  summed. Runs whose report can't be fetched are skipped. */
  async fetchInbox(): Promise<{ encounters: InboxEncounter[]; summary: GhostReportSummary; reports: Map<number, GhostReport> } | null> {
    const runs = this.runRegistry.runs().slice(0, 10);
    const results = await Promise.all(runs.map(async r => ({ run: r, report: await this.fetchReport(r.playerId) })));
    const ok = results.filter(x => !!x.report);
    if (runs.length && !ok.length) return null;
    const summary: GhostReportSummary = { fights: 0, wins: 0, losses: 0, draws: 0, runsEnded: 0, emotes: {} };
    const encounters: InboxEncounter[] = [];
    const reports = new Map<number, GhostReport>();
    for (const { run, report } of ok) {
      reports.set(run.playerId, report!);
      const s = report!.summary;
      summary.fights += s.fights; summary.wins += s.wins; summary.losses += s.losses;
      summary.draws += s.draws; summary.runsEnded += s.runsEnded;
      Object.entries(s.emotes).forEach(([id, n]) => { summary.emotes[id] = (summary.emotes[id] ?? 0) + n; });
      report!.encounters.forEach(e => encounters.push({ ...e, ownerPlayerId: run.playerId, ownerName: run.name }));
    }
    encounters.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return { encounters, summary, reports };
  }

  /** Full recent report (newest first). `since` narrows it to encounters after that time. */
  async fetchReport(playerId: number, since?: string): Promise<GhostReport | null> {
    const run = this.runRegistry.getRun(playerId);
    if (!run) return null;
    try {
      const res = await fetch(`${environment.gameServer}/ghostReport`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, playerToken: run.playerToken, since, limit: 50 }),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      console.error('[GhostReportService] fetch failed', e);
      return null;
    }
  }

  /** Only what's new since the player last opened this run's report. */
  fetchUnseen(playerId: number): Promise<GhostReport | null> {
    return this.fetchReport(playerId, this.runRegistry.getRun(playerId)?.ghostReportSeenAt);
  }

  /** Unseen-encounter counts for every stored run in one request (home-screen run list). */
  async fetchUnseenCounts(): Promise<Map<number, number>> {
    const result = new Map<number, number>();
    const runs = this.runRegistry.runs().slice(0, 10);
    if (!runs.length) return result;
    try {
      const res = await fetch(`${environment.gameServer}/ghostReportCounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          runs: runs.map(r => ({ playerId: r.playerId, playerToken: r.playerToken, since: r.ghostReportSeenAt })),
        }),
      });
      if (!res.ok) return result;
      const counts: Record<string, number> = await res.json();
      Object.entries(counts).forEach(([id, n]) => result.set(Number(id), n));
    } catch (e) {
      console.error('[GhostReportService] counts fetch failed', e);
    }
    return result;
  }

  isUnseen(playerId: number, encounter: GhostEncounter): boolean {
    const seenAt = this.runRegistry.getRun(playerId)?.ghostReportSeenAt;
    return !seenAt || encounter.createdAt > seenAt;
  }

  /** Marks everything up to the newest encounter in `report` as seen for this run. */
  markSeen(playerId: number, report: GhostReport): void {
    const newest = report.encounters[0]?.createdAt;
    if (newest) this.runRegistry.setGhostReportSeenAt(playerId, newest);
    if (this.unseenCounts().get(playerId)) {
      this.unseenCounts.update(m => new Map(m).set(playerId, 0));
    }
  }
}
