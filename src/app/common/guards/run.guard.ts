import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { RunRegistryService } from '../services/run-registry.service';

/** Guards /draft/:id and /fight/:id, where :id is the run's playerId (not a Colyseus sessionId —
 *  nothing ever read that). Validates the specific run rather than "some reconnect token exists
 *  somewhere", which is what let one run's credentials silently stand in for another's. */
export const runGuard: CanActivateFn = (route) => {
  const registry = inject(RunRegistryService);
  const router = inject(Router);

  const id = Number(route.paramMap.get('id'));
  const run = Number.isSafeInteger(id) && id > 0 ? registry.getRun(id) : undefined;
  if (!run || run.status === 'ended') {
    return router.createUrlTree(['/']);
  }
  registry.setActiveRun(id);
  return true;
};
