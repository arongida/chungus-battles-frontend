import { Injectable, signal } from '@angular/core';
import * as Colyseus from '@colyseus/sdk';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FightState } from '../../models/colyseus-schema/FightState';
import { RunRegistryService } from '../../common/services/run-registry.service';

@Injectable({
  providedIn: 'root',
})
export class FightService {
  client: Colyseus.Client;
  room = signal<Colyseus.Room<FightState> | null>(null);

  /** Dev-only "next fight picker" override — consumed (cleared) by the next joinOrCreate.
   *  selectedEnemyName is display-only (for the picker's "next enemy" badge); selectedEnemyId
   *  is the value actually sent to the server. */
  selectedEnemyId = signal<number | null>(null);
  selectedEnemyName = signal<string | null>(null);

  static isLocalStorageAvailable = typeof localStorage !== 'undefined';

  static readonly ALLOWED_FIGHT_SPEEDS = [0.5, 1, 2];
  private static readonly FIGHT_SPEED_STORAGE_KEY = 'fightSpeed';

  /** Set around our own room.leave() calls — see DraftService.intentionalLeave for why. */
  private intentionalLeave = false;

  constructor(private router: Router, private runRegistry: RunRegistryService, private snackBar: MatSnackBar) {
    this.client = new Colyseus.Client(environment.gameServer);
    console.log(`[FightService] client created server=${environment.gameServer}`);
  }

  /** @returns an error message on failure (never throws) — mainly so a caller can suppress its
   *  own follow-up UI (e.g. ready-button's loading spinner still needs to clear), since a
   *  genuine failure here already shows its own snackbar and sends the player home (see below):
   *  this is the ONE call site that starts a brand-new fight, so there's no useful "stay here
   *  and retry" state to leave the player in. Before this, a rejected join (most commonly this
   *  tab's session claim having been taken over by another tab — see the backend's
   *  claimPlayerSession) was silently logged and nothing else, which made the tab feel frozen:
   *  every subsequent click just failed the same invisible way. */
  public async joinOrCreate(playerId: number): Promise<string | null> {
    console.log(`[FightService] creating fight_room playerId=${playerId}`);
    const enemyPlayerId = this.selectedEnemyId();
    this.selectedEnemyId.set(null);
    this.selectedEnemyName.set(null);
    const options = {
      playerId,
      // Same playerToken persisted for this character when its playerId was first minted
      // (see DraftService.createRun) — required by FightRoom.onAuth.
      playerToken: this.runRegistry.tokenFor(playerId),
      ...(enemyPlayerId ? { enemyPlayerId } : {}),
    };

    try {
      const room = await this.client.create('fight_room', options);
      this.enterRoom(room, playerId);

      // On reconnect the synced timeScale is authoritative, so only new rooms get this.
      const storedSpeed = this.getStoredFightSpeed();
      if (storedSpeed !== 1) {
        room.send('set_fight_speed', { speed: storedSpeed });
      }
      return null;
    } catch (e) {
      console.error('[FightService] joinOrCreate error', e);
      const message = e instanceof Error ? e.message : String(e);
      if (/already playing/i.test(message)) {
        // The normal draft->fight transition already awaits DraftService.leave() before this
        // runs, so this is almost always genuine cross-tab/cross-device contention rather than
        // the leave-hasn't-landed-yet race DraftService.joinRun retries for — but a short retry
        // is cheap and covers that edge case too (e.g. leave()'s 4s race timeout was hit).
        await new Promise((resolve) => setTimeout(resolve, 3000));
        try {
          const room = await this.client.create('fight_room', options);
          this.enterRoom(room, playerId);
          return null;
        } catch (e2) {
          console.error('[FightService] joinOrCreate retry error', e2);
        }
      }
      // Send the player home rather than leaving them on a draft/fight screen where the room
      // signal never updates and every action silently goes nowhere — the run list on the home
      // screen reflects the real state and lets them resume properly once it's actually free.
      this.snackBar.open(
        /already playing/i.test(message)
          ? 'This run is active in another tab or window.'
          : 'Could not start the fight — please try again.',
        'Dismiss',
        { duration: 6000, panelClass: 'chungus-snackbar' },
      );
      this.router.navigate(['/']);
      return message || 'Unknown error.';
    }
  }

  /** Tries the live Colyseus reconnection token for this run — see DraftService.tryReconnect for
   *  the full reasoning. Deliberately does NOT fall back to joinOrCreate on failure: that would
   *  start an unearned brand-new fight (and an extra round) for a fight that's actually just
   *  gone. See RunResumeService, which falls back to the draft instead. */
  public async tryReconnect(playerId: number): Promise<boolean> {
    const run = this.runRegistry.getRun(playerId);
    const token = run?.reconnect?.phase === 'fight' ? run.reconnect.token : undefined;
    return token ? this.reconnect(token, playerId) : false;
  }

  private enterRoom(room: Colyseus.Room<FightState>, playerId: number): void {
    this.room.set(room);
    console.log(`[FightService] fight_room joined roomId=${room.roomId} sessionId=${room.sessionId}`);
    this.runRegistry.setReconnect(playerId, 'fight', room.reconnectionToken);
    this.runRegistry.setActiveRun(playerId);
    this.watchForUnexpectedLeave(room);
    this.router.navigate(['/fight', playerId]);
  }

  /** Registered on every room this service obtains — see DraftService.watchForUnexpectedLeave
   *  for the full reasoning. Without this, a fight room whose connection dies for a reason we
   *  didn't initiate leaves every button on screen silently doing nothing forever. */
  private watchForUnexpectedLeave(room: Colyseus.Room<FightState>): void {
    room.onLeave((code) => {
      console.warn(`[FightService] room left code=${code} intentional=${this.intentionalLeave}`);
      if (this.intentionalLeave) return;
      if (this.room() !== room) return;
      this.room.set(null);
      this.snackBar.open('Lost connection to this fight — it may be active in another tab.', 'Dismiss', {
        duration: 6000,
        panelClass: 'chungus-snackbar',
      });
      this.router.navigate(['/']);
    });
  }

  public setFightSpeed(speed: number) {
    if (!FightService.ALLOWED_FIGHT_SPEEDS.includes(speed)) return;
    if (FightService.isLocalStorageAvailable) {
      localStorage.setItem(FightService.FIGHT_SPEED_STORAGE_KEY, String(speed));
    }
    this.room()?.send('set_fight_speed', { speed });
  }

  public getStoredFightSpeed(): number {
    if (!FightService.isLocalStorageAvailable) return 1;
    const stored = Number(localStorage.getItem(FightService.FIGHT_SPEED_STORAGE_KEY));
    return FightService.ALLOWED_FIGHT_SPEEDS.includes(stored) ? stored : 1;
  }

  private async reconnect(reconnectionToken: string, playerId: number): Promise<boolean> {
    console.log(`[FightService] reconnect attempt token=${reconnectionToken.slice(0, 8)}…`);
    try {
      const room = await this.client.reconnect(reconnectionToken) as Colyseus.Room<FightState>;
      console.log(`[FightService] reconnect succeeded roomId=${room.roomId} sessionId=${room.sessionId}`);
      this.enterRoom(room, playerId);
      return true;
    } catch (e) {
      console.warn('[FightService] reconnect failed, falling back to joinOrCreate', e);
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
      // Awaited — see DraftService.leave for why (must resolve before the next room's join, and
      // must precede removeAllListeners()).
      await Promise.race([room.leave(), new Promise((resolve) => setTimeout(resolve, 4000))]);
      room.removeAllListeners();
      this.intentionalLeave = false;
      this.room.set(null);
      if (redirectToHome) this.router.navigate(['/']);
    }
  }
}
