import { Injectable, signal } from '@angular/core';
import {
  MAX_RUNS,
  RUNS_STORAGE_KEY,
  RunRecord,
  RunRegistryBlob,
  RunSummary,
  emptyBlob,
} from '../models/run-record';

/**
 * Sole owner of run identity in localStorage. Everything that used to read/write the flat
 * `playerId`/`playerToken`/`reconnectToken`/`roomId`/`sessionId`/`battleEndState` keys now goes
 * through here instead — see the migration note on `migrateLegacy` for why those keys still
 * matter on first load.
 *
 * Storage is one versioned blob (`chungus.runs`) rather than one key per run, so every write is
 * a single atomic `setItem` and versioning the whole shape is trivial. `mutate()` re-reads the
 * blob from localStorage immediately before applying a change (not from the in-memory signal),
 * so a write from another tab in between two calls here isn't silently clobbered; a `storage`
 * event listener keeps the signals in sync with writes that happen in *other* tabs.
 */
@Injectable({ providedIn: 'root' })
export class RunRegistryService {
  static isLocalStorageAvailable = typeof localStorage !== 'undefined';

  /** Sorted most-recently-played first. */
  readonly runs = signal<RunRecord[]>([]);
  readonly activeRunId = signal<number | null>(null);

  constructor() {
    this.load();
    if (RunRegistryService.isLocalStorageAvailable && typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === RUNS_STORAGE_KEY || e.key === null) {
          this.applyBlob(this.readRaw() ?? emptyBlob());
        }
      });
    }
  }

  getRun(playerId: number): RunRecord | undefined {
    return this.runs().find((r) => r.playerId === playerId);
  }

  tokenFor(playerId: number): string | undefined {
    return this.getRun(playerId)?.playerToken;
  }

  createRun(seed: { playerId: number; playerToken?: string; name: string; avatarUrl: string }): RunRecord {
    const now = Date.now();
    const record: RunRecord = {
      playerId: seed.playerId,
      playerToken: seed.playerToken,
      name: seed.name,
      avatarUrl: seed.avatarUrl,
      status: 'active',
      createdAt: now,
      lastPlayedAt: now,
    };
    this.mutate((blob) => {
      blob.runs[String(seed.playerId)] = record;
    });
    return record;
  }

  patchRun(playerId: number, patch: Partial<RunRecord>): void {
    this.mutate((blob) => {
      const r = blob.runs[String(playerId)];
      if (!r) return;
      Object.assign(r, patch);
      r.lastPlayedAt = Date.now();
    });
  }

  /** Fills in `name`/`avatarUrl` on a migrated record that was created without them — never
   *  overwrites a name a player actually chose. */
  backfillIdentity(playerId: number, name: string, avatarUrl: string): void {
    this.mutate((blob) => {
      const r = blob.runs[String(playerId)];
      if (!r || r.name) return;
      r.name = name;
      if (!r.avatarUrl) r.avatarUrl = avatarUrl;
    });
  }

  setReconnect(playerId: number, phase: 'draft' | 'fight', token: string): void {
    this.mutate((blob) => {
      const r = blob.runs[String(playerId)];
      if (!r) return;
      r.reconnect = { token, phase, updatedAt: Date.now() };
      r.lastPlayedAt = Date.now();
    });
  }

  clearReconnect(playerId: number): void {
    this.mutate((blob) => {
      delete blob.runs[String(playerId)]?.reconnect;
    });
  }

  setSummary(playerId: number, summary: RunSummary): void {
    this.mutate((blob) => {
      const r = blob.runs[String(playerId)];
      if (r) r.summary = summary;
    });
  }

  getBattleEndState(playerId: number): unknown | null {
    return this.getRun(playerId)?.battleEndState ?? null;
  }

  setBattleEndState(playerId: number, state: unknown | null): void {
    this.mutate((blob) => {
      const r = blob.runs[String(playerId)];
      if (!r) return;
      if (state === null) delete r.battleEndState;
      else r.battleEndState = state;
    });
  }

  markEnded(playerId: number): void {
    this.mutate((blob) => {
      const r = blob.runs[String(playerId)];
      if (r) r.status = 'ended';
    });
  }

  removeRun(playerId: number): void {
    this.mutate((blob) => {
      delete blob.runs[String(playerId)];
      if (blob.activeRunId === playerId) blob.activeRunId = null;
    });
  }

  setActiveRun(playerId: number | null): void {
    this.mutate((blob) => {
      blob.activeRunId = playerId;
      if (playerId !== null) {
        const r = blob.runs[String(playerId)];
        if (r) r.lastPlayedAt = Date.now();
      }
    });
  }

  private load(): void {
    let blob = this.readRaw();
    if (blob === null) {
      blob = emptyBlob();
      this.migrateLegacy(blob);
      this.persist(blob);
    }
    this.applyBlob(blob);
  }

  /** Runs once, only when `chungus.runs` doesn't exist yet — folds the old flat keys into a
   *  registry entry so an in-progress run from before this feature existed isn't lost. A
   *  `playerToken` absent from this migration means the character predates token auth entirely
   *  (the backend's `authenticatePlayerId` still grandfathers those in — see PlayerToken.ts) —
   *  never store the *string* 'null' here, only `undefined`. A `reconnectToken` whose phase can't
   *  be inferred from the current URL is dropped rather than guessed at; the run itself still
   *  resumes fine via joinRun, it just loses in-flight fight continuity this one time. */
  private migrateLegacy(blob: RunRegistryBlob): void {
    if (!RunRegistryService.isLocalStorageAvailable) return;
    try {
      const playerIdRaw = localStorage.getItem('playerId');
      const playerId = playerIdRaw ? Number(playerIdRaw) : NaN;
      if (Number.isSafeInteger(playerId) && playerId > 0) {
        const now = Date.now();
        const record: RunRecord = {
          playerId,
          playerToken: localStorage.getItem('playerToken') ?? undefined,
          name: '',
          avatarUrl: '',
          status: 'active',
          createdAt: now,
          lastPlayedAt: now,
        };

        const reconnectToken = localStorage.getItem('reconnectToken');
        if (reconnectToken) {
          const path = typeof location !== 'undefined' ? location.pathname : '';
          const phase = path.includes('/fight/') ? 'fight' : path.includes('/draft/') ? 'draft' : null;
          if (phase) record.reconnect = { token: reconnectToken, phase, updatedAt: now };
        }

        const battleEndStateRaw = localStorage.getItem('battleEndState');
        if (battleEndStateRaw) {
          try {
            record.battleEndState = JSON.parse(battleEndStateRaw);
          } catch { /* drop unparseable leftover state */ }
        }

        blob.runs[String(playerId)] = record;
        blob.activeRunId = playerId;
      }
    } catch (e) {
      console.error('[RunRegistryService] legacy migration failed', e);
    } finally {
      ['playerId', 'playerToken', 'reconnectToken', 'roomId', 'sessionId', 'battleEndState']
        .forEach((k) => localStorage.removeItem(k));
    }
  }

  /** Re-reads from storage before applying `fn`, so a write from another tab in between two
   *  calls here isn't clobbered — see the class doc. Never throws into a caller: a persist
   *  failure is logged and the in-memory signals still reflect the attempted change. */
  private mutate(fn: (blob: RunRegistryBlob) => void): void {
    const blob = this.readRaw() ?? emptyBlob();
    fn(blob);
    this.evictToFit(blob);
    this.persist(blob);
    this.applyBlob(blob);
  }

  /** Keeps the registry under MAX_RUNS by dropping `ended` runs oldest-first, then the oldest
   *  `active` run — but never the currently active run. */
  private evictToFit(blob: RunRegistryBlob): void {
    const all = Object.values(blob.runs);
    const excess = all.length - MAX_RUNS;
    if (excess <= 0) return;
    const candidates = all
      .filter((r) => r.playerId !== blob.activeRunId)
      .sort((a, b) => {
        const aEnded = a.status === 'ended' ? 0 : 1;
        const bEnded = b.status === 'ended' ? 0 : 1;
        return aEnded !== bEnded ? aEnded - bEnded : a.lastPlayedAt - b.lastPlayedAt;
      });
    candidates.slice(0, excess).forEach((r) => delete blob.runs[String(r.playerId)]);
  }

  private applyBlob(blob: RunRegistryBlob): void {
    this.runs.set(Object.values(blob.runs).sort((a, b) => b.lastPlayedAt - a.lastPlayedAt));
    this.activeRunId.set(blob.activeRunId);
  }

  private readRaw(): RunRegistryBlob | null {
    if (!RunRegistryService.isLocalStorageAvailable) return null;
    const raw = localStorage.getItem(RUNS_STORAGE_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.version === 1 && parsed.runs) return parsed as RunRegistryBlob;
      throw new Error('unexpected run registry shape');
    } catch (e) {
      console.error('[RunRegistryService] corrupt run registry, backing up and resetting', e);
      try {
        localStorage.setItem(`${RUNS_STORAGE_KEY}.bak`, raw);
      } catch { /* best-effort backup only */ }
      return null;
    }
  }

  /** Never throws. On quota exhaustion: drop every `battleEndState` (the largest field — it
   *  carries a fight's `stats` payload), then evict `ended` runs oldest-first, retrying once
   *  after each step. A failed write must never propagate into a join path. */
  private persist(blob: RunRegistryBlob): boolean {
    if (!RunRegistryService.isLocalStorageAvailable) return false;
    const trySave = (): boolean => {
      try {
        localStorage.setItem(RUNS_STORAGE_KEY, JSON.stringify(blob));
        return true;
      } catch {
        return false;
      }
    };

    if (trySave()) return true;

    console.warn('[RunRegistryService] persist failed, dropping battleEndState payloads and retrying');
    Object.values(blob.runs).forEach((r) => delete r.battleEndState);
    if (trySave()) return true;

    const endedOldestFirst = Object.values(blob.runs)
      .filter((r) => r.status === 'ended')
      .sort((a, b) => a.lastPlayedAt - b.lastPlayedAt);
    for (const r of endedOldestFirst) {
      delete blob.runs[String(r.playerId)];
      if (trySave()) return true;
    }

    console.error('[RunRegistryService] could not persist run registry even after eviction');
    return false;
  }
}
