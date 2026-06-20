import { Injectable, signal } from '@angular/core';

export interface PanelPosition {
  left: number;
  top: number;
}

@Injectable({
  providedIn: 'root',
})
export class PanelLayoutService {
  private positions: Record<string, PanelPosition> = {};
  private expandedStates: Record<string, boolean> = {};

  /** Incremented each time reset() is called; directives watch this to un-pin themselves. */
  readonly resetTick = signal(0);

  static isLocalStorageAvailable = typeof localStorage !== 'undefined';

  private static readonly STORAGE_KEY = 'panelLayout';
  private static readonly EXPANDED_STORAGE_KEY = 'panelExpanded';

  constructor() {
    this.loadFromLocalStorage();
  }

  getPosition(panelId: string): PanelPosition | undefined {
    return this.positions[panelId];
  }

  savePosition(panelId: string, pos: PanelPosition): void {
    this.positions[panelId] = pos;
    this.persistToLocalStorage();
  }

  /** Returns the saved minimized/maximized state for a panel, or undefined if never saved. */
  getExpanded(panelId: string): boolean | undefined {
    return this.expandedStates[panelId];
  }

  setExpanded(panelId: string, expanded: boolean): void {
    this.expandedStates[panelId] = expanded;
    this.persistExpandedToLocalStorage();
  }

  reset(): void {
    this.positions = {};
    this.expandedStates = {};
    if (PanelLayoutService.isLocalStorageAvailable) {
      localStorage.removeItem(PanelLayoutService.STORAGE_KEY);
      localStorage.removeItem(PanelLayoutService.EXPANDED_STORAGE_KEY);
    }
    this.resetTick.update(n => n + 1);
  }

  private persistToLocalStorage(): void {
    if (!PanelLayoutService.isLocalStorageAvailable) return;
    localStorage.setItem(PanelLayoutService.STORAGE_KEY, JSON.stringify(this.positions));
  }

  private persistExpandedToLocalStorage(): void {
    if (!PanelLayoutService.isLocalStorageAvailable) return;
    localStorage.setItem(PanelLayoutService.EXPANDED_STORAGE_KEY, JSON.stringify(this.expandedStates));
  }

  private loadFromLocalStorage(): void {
    if (!PanelLayoutService.isLocalStorageAvailable) return;
    const saved = localStorage.getItem(PanelLayoutService.STORAGE_KEY);
    if (saved) {
      try {
        this.positions = JSON.parse(saved);
      } catch (e) {
        console.error('Error loading panel layout from localStorage:', e);
        this.positions = {};
      }
    }
    const savedExpanded = localStorage.getItem(PanelLayoutService.EXPANDED_STORAGE_KEY);
    if (savedExpanded) {
      try {
        this.expandedStates = JSON.parse(savedExpanded);
      } catch (e) {
        console.error('Error loading panel expanded state from localStorage:', e);
        this.expandedStates = {};
      }
    }
  }
}
