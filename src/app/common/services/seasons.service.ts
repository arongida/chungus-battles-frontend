import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface SeasonInfo {
  number: number;
  name: string;
  changes: string[];
}

export interface SeasonsResponse {
  currentSeason: number;
  seasons: SeasonInfo[];
}

/** Fetches the seasons list from the backend once and caches it for the session.
 *  Used by the join form, end/leaderboard screen, fight room, and encyclopedia. */
@Injectable({ providedIn: 'root' })
export class SeasonsService {
  private cached: SeasonsResponse | null = null;
  private inFlight: Promise<SeasonsResponse> | null = null;

  async getSeasons(): Promise<SeasonsResponse> {
    if (this.cached) return this.cached;
    if (this.inFlight) return this.inFlight;
    this.inFlight = fetch(`${environment.gameServer}/seasons`)
      .then(r => r.json() as Promise<SeasonsResponse>)
      .then(data => {
        this.cached = data;
        this.inFlight = null;
        return data;
      })
      .catch(err => {
        console.error('[SeasonsService] Failed to fetch seasons:', err);
        this.inFlight = null;
        return { currentSeason: 0, seasons: [] };
      });
    return this.inFlight;
  }

  /** Convenience getter — returns 0 until the fetch completes. */
  get currentSeason(): number {
    return this.cached?.currentSeason ?? 0;
  }
}
