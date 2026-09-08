import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { RunRegistryService } from '../services/run-registry.service';
import { FightService } from '../../fight/services/fight.service';

/** Guards /draft/:id and /fight/:id, where :id is the run's playerId (not a Colyseus sessionId —
 *  nothing ever read that). Validates the specific run rather than "some reconnect token exists
 *  somewhere", which is what let one run's credentials silently stand in for another's.
 *
 *  Also redirects to the run's actual current phase: since the backend now enforces one live
 *  session per character, a mid-fight run navigated at /draft/:id (back button, a stale link,
 *  the run list) would otherwise dead-end on a correctly-rejected "Player already playing!" —
 *  send it to /fight/:id instead, where it can actually resume. */
export const runGuard: CanActivateFn = (route, state) => {
  const registry = inject(RunRegistryService);
  const fightService = inject(FightService);
  const router = inject(Router);

  const id = Number(route.paramMap.get('id'));
  const run = Number.isSafeInteger(id) && id > 0 ? registry.getRun(id) : undefined;
  if (!run || run.status === 'ended') {
    return router.createUrlTree(['/']);
  }

  const onFightRoute = state.url.startsWith('/fight/');

  // A live client-side FightRoom is the strongest signal there is: back-buttoning to /draft here
  // would leave that room running headless (FightRoom.autoDispose = false) while a second
  // draft_room join attempt gets correctly rejected — or worse, before the backend fix, silently
  // succeeded on a pre-fight snapshot. Route to the room that's actually still connected.
  if (!onFightRoute && fightService.room()) {
    return router.createUrlTree(['/fight', id]);
  }

  // Otherwise trust the registry's last known phase. Safe against redirect loops: every
  // navigation into a room sets the phase BEFORE navigating (DraftService/FightService.enterRoom),
  // and RunResumeService clears a stale phase before falling back, so the target route always
  // agrees with the phase by the time its guard re-runs.
  const phase = run.reconnect?.phase;
  if (phase === 'fight' && !onFightRoute) return router.createUrlTree(['/fight', id]);
  if (phase === 'draft' && onFightRoute) return router.createUrlTree(['/draft', id]);

  registry.setActiveRun(id);
  return true;
};
