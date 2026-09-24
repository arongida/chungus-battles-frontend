import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { RunRegistryService } from './run-registry.service';
import { DraftService } from '../../draft/services/draft.service';
import { FightService } from '../../fight/services/fight.service';

/**
 * Single phase-aware entry point for every "resume this run" affordance (the home screen's
 * "Continue a Run" list, and both room components' initial load) — kept out of DraftService/
 * FightService so neither has to depend on the other.
 *
 * Routing by the run's last known phase matters now that the backend actually enforces one live
 * session per character (see the backend's claimPlayerSession/BaseRoom): a mid-fight run's
 * Resume must go back into the still-live FightRoom, not dead-end on DraftRoom correctly
 * rejecting it with "Player already playing!".
 */
@Injectable({ providedIn: 'root' })
export class RunResumeService {
  constructor(
    private runRegistry: RunRegistryService,
    private draftService: DraftService,
    private fightService: FightService,
    private router: Router,
  ) {}

  /** Resumes in progress, by playerId. A second resume of the same run while one is in flight
   *  shares the first instead of starting a parallel join: two concurrent joinRun calls race
   *  for the backend's one-session-per-character claim, and the loser's "Player already
   *  playing!" bounced the player back to the home screen even though the winner succeeded
   *  (e.g. the run list's Resume button click also bubbling to its row's own click handler). */
  private inFlight = new Map<number, Promise<void>>();

  resume(playerId: number): Promise<void> {
    const existing = this.inFlight.get(playerId);
    if (existing) return existing;
    const attempt = this.doResume(playerId).finally(() => this.inFlight.delete(playerId));
    this.inFlight.set(playerId, attempt);
    return attempt;
  }

  private async doResume(playerId: number): Promise<void> {
    const run = this.runRegistry.getRun(playerId);

    if (run?.reconnect?.phase === 'fight') {
      if (await this.fightService.tryReconnect(playerId)) return;
      // The fight room is genuinely gone — its onLeave already ran (round++, save, release), so
      // the run's true state is "back in the shop for the next round". Drop the stale fight
      // token before falling through, or runGuard would just bounce us straight back to /fight.
      this.runRegistry.clearReconnect(playerId);
    } else if (run?.reconnect?.phase === 'draft') {
      if (await this.draftService.tryReconnect(playerId)) return;
      this.runRegistry.clearReconnect(playerId);
    }

    // joinRun already handles the "already playing" hand-off race with its own wait-and-retry,
    // and marks the run ended on "no lives left" — see draft.service.ts.
    const errorMessage = await this.draftService.joinRun(playerId);
    if (errorMessage) {
      console.error('[RunResumeService] resume failed', errorMessage);
      this.router.navigate(['/']);
    }
  }
}
