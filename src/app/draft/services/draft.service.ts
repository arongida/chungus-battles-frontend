import { Injectable, effect, signal, untracked } from '@angular/core';
import * as Colyseus from 'colyseus.js';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';
import { DraftState } from '../../models/colyseus-schema/DraftState';
import { Player } from '../../models/colyseus-schema/PlayerSchema';

@Injectable({
  providedIn: 'root',
})
export class DraftService {
  client: Colyseus.Client;
  room: Colyseus.Room<DraftState> | undefined;
  player: Player | undefined;
  private trackedCollectionIdsSignal = signal<number[]>([]);
  private isInitialized = false;

  static isLocalStorageAvailable = typeof localStorage !== 'undefined';

  constructor(private router: Router) {
    this.client = new Colyseus.Client(environment.gameServer);
    // Initialize from localStorage if available
    this.loadTrackedCollectionsFromLocalStorage();
  }

  // Getter for the signal
  trackedCollectionIds() {
    return this.trackedCollectionIdsSignal();
  }

  // Method to update the tracked collections
  updateTrackedCollections(newCollectionIds: number[]) {
    // Use untracked when reading from localStorage to prevent cycles
    this.trackedCollectionIdsSignal.set(newCollectionIds);

    this.saveTrackedCollectionsToLocalStorage();
  }

  // Optional: Add method for single collection toggle
  toggleCollectionTracking(collectionId: number) {
    const currentTracked = this.trackedCollectionIdsSignal();
    if (currentTracked.includes(collectionId)) {
      this.updateTrackedCollections(currentTracked.filter((id) => id !== collectionId));
    } else {
      this.updateTrackedCollections([...currentTracked, collectionId]);
    }
  }

  saveTrackedCollectionsToLocalStorage() {
    if (!DraftService.isLocalStorageAvailable || !this.isInitialized) return;
    console.log('save triggered');
    localStorage.setItem('trackedCollections', JSON.stringify(this.trackedCollectionIdsSignal()));
  }

  loadTrackedCollectionsFromLocalStorage() {
    if (!DraftService.isLocalStorageAvailable) return;
    const saved = localStorage.getItem('trackedCollections');
    if (saved) {
      try {
        const parsedData = JSON.parse(saved);
        // Use update instead of set to avoid triggering effects during initialization
        this.trackedCollectionIdsSignal.set(parsedData);
        this.isInitialized = true;
      } catch (e) {
        console.error('Error loading tracked collections from localStorage:', e);
        this.trackedCollectionIdsSignal.set([]);
      }
    }
  }

  resetTrackedCollections() {
    this.trackedCollectionIdsSignal.set([]);
    this.saveTrackedCollectionsToLocalStorage();
  }

  public async joinOrCreate(name?: string, playerIdInput?: number, avatarUrl?: string): Promise<string | null> {
    try {
      let playerId = playerIdInput;
      if (!playerId) {
        const result = await fetch(environment.expressServer + '/playerId')
          .then((res) => res.json())
          .catch((e) => console.error(e));
        playerId = result.playerId;
      }

      this.room = await this.client.joinOrCreate('draft_room', {
        name: name,
        playerId: playerId,
        avatarUrl: avatarUrl,
      });

      this.room.onMessage('*', (type, message) => {
        console.log('message: ', type, message);
      });

      console.log('joined successfully', this.room);

      if (DraftService.isLocalStorageAvailable) {
        localStorage.setItem('sessionId', this.room.sessionId);
        localStorage.setItem('playerId', playerId!.toString());
        localStorage.setItem('roomId', this.room.roomId);
        localStorage.setItem('reconnectToken', this.room.reconnectionToken);
      }

      this.router.navigate(['/draft', this.room.sessionId]);
      return null;
    } catch (e) {
      console.error('join error', e);
      const message = e instanceof Error ? e.message : 'Unknown error.';
      return message;
    }
  }

  public async reconnect(reconnectionToken: string) {
    try {
      this.room = await this.client.reconnect(reconnectionToken);

      this.room.onMessage('*', (type, message) => {
        console.log('message: ', type, message);
      });

      if (DraftService.isLocalStorageAvailable) {
        localStorage.setItem('sessionId', this.room.sessionId);
        localStorage.setItem('roomId', this.room.roomId);
        localStorage.setItem('reconnectToken', this.room.reconnectionToken);
      }

      this.router.navigate(['/draft', this.room.sessionId]);
    } catch (e) {
      console.error('reconnect error', e);
      this.router.navigate(['/']);
    }
  }

  public async sendMessage(type: string, message: {}) {
    if (this.room) {
      this.room.send(type, message);
    }
  }

  public async leave(redirectToHome = true) {
    if (this.room) {
      this.room.leave();
      this.room.removeAllListeners();
      this.room = undefined;
      if (redirectToHome) this.router.navigate(['/']);
    }
  }
}
