import { Injectable, signal } from '@angular/core';
import * as Colyseus from '@colyseus/sdk';
import {
  environment,
} from '../../../environments/environment';
import { Router } from '@angular/router';
import {
  DraftState,
} from '../../models/colyseus-schema/DraftState';
import {
  Player,
} from '../../models/colyseus-schema/PlayerSchema';
import { RunRegistryService } from '../../common/services/run-registry.service';

@Injectable({
  providedIn: 'root',
})
export class DraftService {
  client: Colyseus.Client;
  room = signal<Colyseus.Room<DraftState> | null>(null);
  player: Player | undefined;
  /** True while the most recent item sale can still be undone (see DraftState.canUndoSell). */
  canUndoSell = signal(false);

  constructor(private router: Router, private runRegistry: RunRegistryService) {
    this.client = new Colyseus.Client(environment.gameServer);
  }

  /** Starts a brand-new character. Mints a playerId + playerToken from /playerid — the token
   *  authenticates this id for every future join (see onAuth on DraftRoom/FightRoom and the
   *  backend's PlayerToken.ts) and is persisted in the run registry from here on. */
  public async createRun(name: string, avatarUrl?: string): Promise<string | null> {
    try {
      const result = await fetch(environment.gameServer + '/playerid')
        .then((res) => res.json())
        .catch((e) => console.error(e));
      const playerId: number | undefined = result?.playerId;
      if (!playerId) return 'Could not start a new run — please try again.';

      this.runRegistry.createRun({
        playerId,
        playerToken: result?.playerToken,
        name,
        avatarUrl: avatarUrl ?? '',
      });

      return this.joinRun(playerId, name, avatarUrl);
    } catch (e) {
      console.error('[DraftService] createRun error', e);
      return e instanceof Error ? e.message : 'Unknown error.';
    }
  }

  /** Joins (or rejoins) an existing character by playerId, using the token already stored for
   *  it in the run registry. This is the resume path DraftRoom.onJoin's `foundPlayer` branch
   *  supports — no fresh /playerid call, no new token. */
  public async joinRun(playerId: number, nameOverride?: string, avatarUrlOverride?: string): Promise<string | null> {
    const run = this.runRegistry.getRun(playerId);
    const name = nameOverride ?? run?.name;
    const avatarUrl = avatarUrlOverride ?? run?.avatarUrl;
    if (!name) {
      // Migrated record whose name hasn't been backfilled yet — DraftRoom.onJoin requires one
      // even when rejoining an existing character (see run-summaries.service.ts).
      return 'Still fetching this run\'s details — try again in a moment.';
    }

    try {
      console.log(`[DraftService] creating draft_room playerId=${playerId}`);
      const room = await this.client.create('draft_room', {
        name,
        playerId,
        avatarUrl,
        playerToken: run?.playerToken,
      });
      this.enterRoom(room, playerId);
      return null;
    } catch (e) {
      console.error('[DraftService] joinRun error', e);
      const message = e instanceof Error ? e.message : String(e);
      if (/already playing/i.test(message)) {
        // The 30s Colyseus reconnection window has expired but the server hasn't finished
        // saving/clearing sessionId yet (onLeave -> disconnect() is a further 5s) — wait it
        // out and retry exactly once rather than surfacing a dead end.
        await new Promise((resolve) => setTimeout(resolve, 6000));
        try {
          const room = await this.client.create('draft_room', { name, playerId, avatarUrl, playerToken: run?.playerToken });
          this.enterRoom(room, playerId);
          return null;
        } catch (e2) {
          console.error('[DraftService] joinRun retry error', e2);
          return 'This run is still wrapping up on the server. Try again in a few seconds.';
        }
      }
      if (/no lives left/i.test(message)) {
        this.runRegistry.markEnded(playerId);
        return 'That run has ended.';
      }
      return message || 'Unknown error.';
    }
  }

  /** Resumes a run on route entry: tries the live Colyseus reconnection token first (works only
   *  inside the ~30s window while the room still exists, and bypasses the sessionId mutex
   *  entirely), falling back to joinRun (always works while the character is alive). */
  public async resumeRun(playerId: number): Promise<void> {
    const run = this.runRegistry.getRun(playerId);
    const token = run?.reconnect?.phase === 'draft' ? run.reconnect.token : undefined;
    if (token && (await this.reconnect(token, playerId))) return;

    const errorMessage = await this.joinRun(playerId);
    if (errorMessage) {
      console.error('[DraftService] resumeRun failed', errorMessage);
      this.router.navigate(['/']);
    }
  }

  private enterRoom(room: Colyseus.Room<DraftState>, playerId: number): void {
    this.room.set(room);
    console.log(`[DraftService] draft_room joined roomId=${room.roomId} sessionId=${room.sessionId}`);
    this.runRegistry.setReconnect(playerId, 'draft', room.reconnectionToken);
    this.runRegistry.setActiveRun(playerId);
    this.router.navigate(['/draft', playerId]);
  }

  private async reconnect(reconnectionToken: string, playerId: number): Promise<boolean> {
    console.log(`[DraftService] reconnect attempt token=${reconnectionToken.slice(0, 8)}…`);
    try {
      const room = await this.client.reconnect(reconnectionToken) as Colyseus.Room<DraftState>;
      console.log(`[DraftService] reconnect succeeded roomId=${room.roomId} sessionId=${room.sessionId}`);

      room.onLeave((code) => {
        console.warn(`[DraftService] room left after reconnect code=${code}`);
      });

      this.enterRoom(room, playerId);
      return true;
    } catch (e) {
      console.warn('[DraftService] reconnect failed, falling back to joinRun', e);
      return false;
    }
  }

  public async sendMessage(type: string, message: {}) {
    const room = this.room();
    if (room) {
      room.send(type, message);
    }
  }

  public async leave(redirectToHome = true) {
    const room = this.room();
    if (room) {
      room.leave();
      room.removeAllListeners();
      this.room.set(null);
      this.canUndoSell.set(false);
      if (redirectToHome) this.router.navigate(['/']);
    }
  }
}
