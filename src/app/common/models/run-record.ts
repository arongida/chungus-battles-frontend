/** localStorage key for the whole run registry blob — see RunRegistryService. */
export const RUNS_STORAGE_KEY = 'chungus.runs';

/** Max runs kept in the registry — oldest `ended` runs are evicted first, then oldest
 *  `lastPlayedAt`, to make room for a new one. */
export const MAX_RUNS = 8;

export interface RunSummary {
  level: number;
  round: number;
  lives: number;
  wins: number;
  gameVersion: number;
  /** Server-side sessionId !== '' with a live (non-stale) heartbeat — someone (possibly another
   *  tab) is actively connected to this run right now. Resuming is still attempted; this only
   *  sets viewer expectations. */
  busy: boolean;
  /** Which room type currently holds the claim — only meaningful when busy. */
  busyPhase?: 'draft' | 'fight';
  fetchedAt: number;
}

export interface RunReconnect {
  token: string;
  phase: 'draft' | 'fight';
  updatedAt: number;
}

export interface RunRecord {
  playerId: number;
  /** Auth credential minted once by GET /playerid — see PlayerToken.ts on the backend. Absent
   *  only for a legacy/grandfathered character migrated from before token auth existed. */
  playerToken?: string;
  /** '' only for a migrated record whose name hasn't been backfilled yet (see RunSummariesService). */
  name: string;
  avatarUrl: string;
  status: 'active' | 'ended';
  createdAt: number;
  lastPlayedAt: number;
  reconnect?: RunReconnect;
  summary?: RunSummary;
  /** Post-fight modal state (end_battle/game_over/game_win), scoped per run so a modal from one
   *  run can't resurface on another after a switch. */
  battleEndState?: unknown;
  /** Who delivered this run's final loss (from game_over) — shown on the run list with their
   *  current status, since their run keeps going after they beat you. */
  nemesis?: RunNemesis;
  /** ISO time of the newest ghost encounter the player has seen for this run — the ghost report
   *  only counts/teases encounters after it. Tracked client-side only (the server never writes
   *  "seen"), so it's per browser, like everything else in this registry. */
  ghostReportSeenAt?: string;
}

export interface RunNemesis {
  name: string;
  avatarUrl: string;
  originalPlayerId: number;
}

export interface RunRegistryBlob {
  version: 1;
  activeRunId: number | null;
  runs: Record<string, RunRecord>;
}

export function emptyBlob(): RunRegistryBlob {
  return { version: 1, activeRunId: null, runs: {} };
}
