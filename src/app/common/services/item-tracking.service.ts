import { Injectable, signal } from '@angular/core';

/** Tracked-collection ids are scoped per run — each run gets its own localStorage key — so
 *  switching between runs (via the run list) doesn't carry one run's tracked collections onto
 *  another's shop/inventory view. `load`/`save` below take the active playerId explicitly rather
 *  than reading it themselves, keeping this service free of any RunRegistryService dependency. */
@Injectable({
  providedIn: 'root',
})
export class ItemTrackingService {
  private trackedCollectionIdsSignal = signal<number[]>([]);
  private currentPlayerId: number | null = null;

  static isLocalStorageAvailable = typeof localStorage !== 'undefined';

  private static storageKey(playerId: number): string {
    return `trackedCollections.${playerId}`;
  }

  trackedCollectionIds() {
    return this.trackedCollectionIdsSignal();
  }

  /** Switches the active run and loads that run's tracked collections. Call this whenever the
   *  active playerId changes (draft-room/fight-room init) — a no-op if already on that run. */
  load(playerId: number) {
    if (this.currentPlayerId === playerId) return;
    this.currentPlayerId = playerId;
    if (!ItemTrackingService.isLocalStorageAvailable) {
      this.trackedCollectionIdsSignal.set([]);
      return;
    }
    const saved = localStorage.getItem(ItemTrackingService.storageKey(playerId));
    if (saved) {
      try {
        this.trackedCollectionIdsSignal.set(JSON.parse(saved));
        return;
      } catch (e) {
        console.error('Error loading tracked collections from localStorage:', e);
      }
    }
    this.trackedCollectionIdsSignal.set([]);
  }

  updateTrackedCollections(newCollectionIds: number[]) {
    this.trackedCollectionIdsSignal.set(newCollectionIds);
    this.save();
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

  private save() {
    if (!ItemTrackingService.isLocalStorageAvailable || this.currentPlayerId === null) return;
    localStorage.setItem(
      ItemTrackingService.storageKey(this.currentPlayerId),
      JSON.stringify(this.trackedCollectionIdsSignal()),
    );
  }

  resetTrackedCollections() {
    this.trackedCollectionIdsSignal.set([]);
    this.save();
  }
}
