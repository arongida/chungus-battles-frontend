import { Injectable } from '@angular/core';
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

/**
 * "While you were away" — how a character's ghosts (its matchmaking snapshots) did in other
 * players' fights. There are no accounts: each run's playerToken (from RunRegistryService)
 * proves this browser owns the character, and "seen" is tracked per run in the registry, so the
 * report only reaches the browser that created the run. See backend POST /ghostReport.
 */
@Injectable({ providedIn: 'root' })
export class GhostReportService {
  constructor(private runRegistry: RunRegistryService) {}

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
  }
}
