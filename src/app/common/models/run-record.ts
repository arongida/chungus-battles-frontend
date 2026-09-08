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
  /** Server-side sessionId !== '' — someone (possibly another tab) may already be connected to
   *  this run. Resuming is still attempted; this only sets viewer expectations. */
  busy: boolean;
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
}

export interface RunRegistryBlob {
  version: 1;
  activeRunId: number | null;
  runs: Record<string, RunRecord>;
}

export function emptyBlob(): RunRegistryBlob {
  return { version: 1, activeRunId: null, runs: {} };
}
