import { Injectable, signal } from '@angular/core';
import * as Colyseus from '@colyseus/sdk';
import {
  environment,
} from '../../../environments/environment';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
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

  /** Set around our own room.leave() calls so watchForUnexpectedLeave can tell "we did this on
   *  purpose, leave() already handles cleanup/navigation" apart from a room dying under us. */
  private intentionalLeave = false;

  constructor(private router: Router, private runRegistry: RunRegistryService, private snackBar: MatSnackBar) {
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

  /** Tries the live Colyseus reconnection token for this run (works only inside the ~30s window
   *  while the room still exists, and — unlike joinRun — bypasses the session-claim mutex
   *  entirely, since Colyseus resumes the SAME room object without re-running onJoin). Returns
   *  false (never throws) when there's no usable token or the attempt fails, so callers can fall
   *  back to joinRun. See RunResumeService, the actual entry point for "resume this run". */
  public async tryReconnect(playerId: number): Promise<boolean> {
    const run = this.runRegistry.getRun(playerId);
    const token = run?.reconnect?.phase === 'draft' ? run.reconnect.token : undefined;
    return token ? this.reconnect(token, playerId) : false;
  }

  private enterRoom(room: Colyseus.Room<DraftState>, playerId: number): void {
    this.room.set(room);
    console.log(`[DraftService] draft_room joined roomId=${room.roomId} sessionId=${room.sessionId}`);
    this.runRegistry.setReconnect(playerId, 'draft', room.reconnectionToken);
    this.runRegistry.setActiveRun(playerId);
    this.watchForUnexpectedLeave(room);
    this.router.navigate(['/draft', playerId]);
  }

  /** Registered on every room this service obtains (fresh join or reconnect) — without this, a
   *  room whose connection ends for any reason we didn't initiate (this tab's session claim
   *  taken over by another tab/device, a network drop that outlasts Colyseus's own retry, the
   *  server closing it) leaves `room()` pointing at a dead object forever: sendMessage() keeps
   *  calling .send() on it, which silently goes nowhere — every click looks "frozen" with no
   *  error, since nothing ever told the UI the connection was gone. */
  private watchForUnexpectedLeave(room: Colyseus.Room<DraftState>): void {
    room.onLeave((code) => {
      console.warn(`[DraftService] room left code=${code} intentional=${this.intentionalLeave}`);
      if (this.intentionalLeave) return; // our own leave() call already handles cleanup/navigation
      if (this.room() !== room) return; // a newer room has since replaced this one — not our problem
      this.room.set(null);
      this.canUndoSell.set(false);
      this.snackBar.open('Lost connection to this run — it may be active in another tab.', 'Dismiss', {
        duration: 6000,
        panelClass: 'chungus-snackbar',
      });
      this.router.navigate(['/']);
    });
  }

  private async reconnect(reconnectionToken: string, playerId: number): Promise<boolean> {
    console.log(`[DraftService] reconnect attempt token=${reconnectionToken.slice(0, 8)}…`);
    try {
      const room = await this.client.reconnect(reconnectionToken) as Colyseus.Room<DraftState>;
      console.log(`[DraftService] reconnect succeeded roomId=${room.roomId} sessionId=${room.sessionId}`);
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
      this.intentionalLeave = true;
      // Awaited (with a timeout so a wedged socket can't hang the transition forever): room.leave()
      // resolves only once the server has finished onLeave (save + releasePlayerSession — see
      // DraftRoom.ts), and the next room's join races that release, now that "Player already
      // playing!" is actually enforced. Must come before removeAllListeners() — that clears the
      // room.onLeave callback the leave() promise's resolution depends on.
      await Promise.race([room.leave(), new Promise((resolve) => setTimeout(resolve, 4000))]);
      room.removeAllListeners();
      this.intentionalLeave = false;
      this.room.set(null);
      this.canUndoSell.set(false);
      if (redirectToHome) this.router.navigate(['/']);
    }
  }
}
