import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class ItemTrackingService {
  private trackedCollectionIdsSignal = signal<number[]>([]);
  private isInitialized = false;

  static isLocalStorageAvailable = typeof localStorage !== 'undefined';

  constructor(private router: Router) {
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
    if (!ItemTrackingService.isLocalStorageAvailable || !this.isInitialized) return;
    console.log('save triggered');
    localStorage.setItem('trackedCollections', JSON.stringify(this.trackedCollectionIdsSignal()));
  }

  loadTrackedCollectionsFromLocalStorage() {
    if (!ItemTrackingService.isLocalStorageAvailable) return;
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
}
