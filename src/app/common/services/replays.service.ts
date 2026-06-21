import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { ReplayListItem } from '../../replay/replay-room.component';

/**
 * Fetches and caches a player's fight-replay list (by `originalPlayerId`). Lives in a root
 * singleton — rather than on ReplaysDialogComponent — so the cache survives across opens of the
 * (short-lived) replays dialog, matching the caching behavior the toolbar used to own directly.
 */
@Injectable({ providedIn: 'root' })
export class ReplaysService {
  private cache = new Map<number, ReplayListItem[]>();

  async getReplays(originalPlayerId: number): Promise<ReplayListItem[]> {
    const cached = this.cache.get(originalPlayerId);
    if (cached) return cached;

    try {
      const data = await fetch(`${environment.gameServer}/replays?originalPlayerId=${originalPlayerId}`).then(r => r.json());
      const list: ReplayListItem[] = Array.isArray(data) ? data.reverse() : [];
      this.cache.set(originalPlayerId, list);
      return list;
    } catch {
      return [];
    }
  }
}
