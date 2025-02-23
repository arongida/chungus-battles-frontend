import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ItemTrackingService {
  private trackedCollectionIdsSignal = signal<number[]>([]);
  private isInitialized = false;

  static isLocalStorageAvailable = typeof localStorage !== 'undefined';

  constructor() {
    this.loadTrackedCollectionsFromLocalStorage();
  }

  trackedCollectionIds() {
    return this.trackedCollectionIdsSignal();
  }

  updateTrackedCollections(newCollectionIds: number[]) {
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
    if (!ItemTrackingService.isLocalStorageAvailable || !this.isInitialized) return;
    localStorage.setItem('trackedCollections', JSON.stringify(this.trackedCollectionIdsSignal()));
  }

  loadTrackedCollectionsFromLocalStorage() {
    if (!ItemTrackingService.isLocalStorageAvailable) return;
    const saved = localStorage.getItem('trackedCollections');
    if (saved) {
      try {
        const parsedData = JSON.parse(saved);
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
}
