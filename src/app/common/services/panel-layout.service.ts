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

  /** Incremented each time reset() is called; directives watch this to un-pin themselves. */
  readonly resetTick = signal(0);

  static isLocalStorageAvailable = typeof localStorage !== 'undefined';

  private static readonly STORAGE_KEY = 'panelLayout';

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

  reset(): void {
    this.positions = {};
    if (PanelLayoutService.isLocalStorageAvailable) {
      localStorage.removeItem(PanelLayoutService.STORAGE_KEY);
    }
    this.resetTick.update(n => n + 1);
  }

  private persistToLocalStorage(): void {
    if (!PanelLayoutService.isLocalStorageAvailable) return;
    localStorage.setItem(PanelLayoutService.STORAGE_KEY, JSON.stringify(this.positions));
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
  }
}
