import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { RunRegistryService } from './run-registry.service';

interface RunSummaryDto {
  playerId: number;
  name: string;
  avatarUrl: string;
  level: number;
  round: number;
  lives: number;
  wins: number;
  losses: number;
  gameVersion: number;
  busy: boolean;
  busyPhase?: 'draft' | 'fight';
}

/** Fetches lean run summaries (level/round/lives/…) for the run list — deliberately NOT
 *  /playerBuild, which fully rehydrates inventory/equipped/talents/lockedShop (multi-KB per run)
 *  for data that's five scalars. See backend GET /runSummaries (Player.ts's getRunSummaries). */
@Injectable({ providedIn: 'root' })
export class RunSummariesService {
  private static readonly MAX_IDS_PER_REQUEST = 10;

  constructor(private runRegistry: RunRegistryService) {}

  /** `null` when the request failed (server down/restarting, network error) — distinct from an
   *  empty map, which is a successful answer of "none of these exist". Callers must not treat a
   *  failure as "every run is gone" (see refreshAll). */
  async fetch(playerIds: number[]): Promise<Map<number, RunSummaryDto> | null> {
    const result = new Map<number, RunSummaryDto>();
    if (!playerIds.length) return result;
    const ids = playerIds.slice(0, RunSummariesService.MAX_IDS_PER_REQUEST);
    try {
      const res = await fetch(`${environment.gameServer}/runSummaries?playerIds=${ids.join(',')}`);
      if (!res.ok) return null;
      const dtos: RunSummaryDto[] = await res.json();
      if (!Array.isArray(dtos)) return null;
      dtos.forEach((dto) => result.set(dto.playerId, dto));
    } catch (e) {
      console.error('[RunSummariesService] fetch failed', e);
      return null;
    }
    return result;
  }

  /** Refreshes every stored run's summary in one batched call, backfilling name/avatar for
   *  migrated records. A run missing from the response was minted by /playerid but never
   *  actually joined draft — pruned silently rather than shown as a broken row forever.
   *
   *  Pruning only ever happens on a SUCCESSFUL response: a failed request used to come back as an
   *  empty map, which made every stored run look "missing" and deleted them all — and since the
   *  run's playerToken lives only in this registry, those runs were unrecoverable. Any server
   *  blip (deploy, restart, a cold machine) on the home screen wiped the player's runs. Also only
   *  the ids actually sent (the request is capped) are eligible for pruning. */
  async refreshAll(): Promise<void> {
    const runs = this.runRegistry.runs().slice(0, RunSummariesService.MAX_IDS_PER_REQUEST);
    if (!runs.length) return;
    const summaries = await this.fetch(runs.map((r) => r.playerId));
    if (!summaries) return;
    for (const run of runs) {
      const dto = summaries.get(run.playerId);
      if (!dto) {
        this.runRegistry.removeRun(run.playerId);
        continue;
      }
      this.runRegistry.setSummary(run.playerId, {
        level: dto.level,
        round: dto.round,
        lives: dto.lives,
        wins: dto.wins,
        gameVersion: dto.gameVersion,
        busy: dto.busy,
        busyPhase: dto.busyPhase,
        fetchedAt: Date.now(),
      });
      this.runRegistry.backfillIdentity(run.playerId, dto.name, dto.avatarUrl);
      if (dto.lives <= 0) this.runRegistry.markEnded(run.playerId);
    }
  }
}
