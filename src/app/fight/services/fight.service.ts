import { Injectable, signal } from '@angular/core';
import * as Colyseus from '@colyseus/sdk';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';
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

  constructor(private router: Router, private runRegistry: RunRegistryService) {
    this.client = new Colyseus.Client(environment.gameServer);
    console.log(`[FightService] client created server=${environment.gameServer}`);
  }

  public async joinOrCreate(playerId: number) {
    console.log(`[FightService] creating fight_room playerId=${playerId}`);
    try {
      const enemyPlayerId = this.selectedEnemyId();
      this.selectedEnemyId.set(null);
      this.selectedEnemyName.set(null);
      const room = await this.client.create('fight_room', {
        playerId: playerId,
        // Same playerToken persisted for this character when its playerId was first minted
        // (see DraftService.createRun) — required by FightRoom.onAuth.
        playerToken: this.runRegistry.tokenFor(playerId),
        ...(enemyPlayerId ? { enemyPlayerId } : {}),
      });
      this.enterRoom(room, playerId);

      // On reconnect the synced timeScale is authoritative, so only new rooms get this.
      const storedSpeed = this.getStoredFightSpeed();
      if (storedSpeed !== 1) {
        room.send('set_fight_speed', { speed: storedSpeed });
      }
    } catch (e) {
      console.error('[FightService] joinOrCreate error', e);
    }
  }

  /** Resumes a run on route entry — see DraftService.resumeRun for the reconnect-then-rejoin shape. */
  public async resumeRun(playerId: number): Promise<void> {
    const run = this.runRegistry.getRun(playerId);
    const token = run?.reconnect?.phase === 'fight' ? run.reconnect.token : undefined;
    if (token && (await this.reconnect(token, playerId))) return;

    await this.joinOrCreate(playerId);
  }

  private enterRoom(room: Colyseus.Room<FightState>, playerId: number): void {
    this.room.set(room);
    console.log(`[FightService] fight_room joined roomId=${room.roomId} sessionId=${room.sessionId}`);
    this.runRegistry.setReconnect(playerId, 'fight', room.reconnectionToken);
    this.runRegistry.setActiveRun(playerId);
    this.router.navigate(['/fight', playerId]);
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

      room.onLeave((code) => {
        console.warn(`[FightService] room left after reconnect code=${code}`);
      });

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
      room.leave();
      room.removeAllListeners();
      this.room.set(null);
      if (redirectToHome) this.router.navigate(['/']);
    }
  }
}
