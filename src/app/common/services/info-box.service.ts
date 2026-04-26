import { Injectable, signal } from '@angular/core';
import { InfoContent } from '../models/info-content';

@Injectable({ providedIn: 'root' })
export class InfoBoxService {
  readonly isVisible = signal<boolean>(true);
  readonly currentContent = signal<InfoContent | null>(null);
  readonly pageDefault = signal<InfoContent | null>(null);

  toggle(): void {
    this.isVisible.update(v => !v);
  }

  private _clearTimer: ReturnType<typeof setTimeout> | null = null;

  setContent(content: InfoContent): void {
    if (this._clearTimer) {
      clearTimeout(this._clearTimer);
      this._clearTimer = null;
    }
    this.currentContent.set(content);
  }

  clearContent(): void {
    this.currentContent.set(null);
  }

  clearContentDelayed(ms = 1000): void {
    this._clearTimer = setTimeout(() => {
      this._clearTimer = null;
      this.currentContent.set(null);
    }, ms);
  }

  setPageDefault(content: InfoContent): void {
    this.pageDefault.set(content);
  }

  clearPageDefault(): void {
    this.pageDefault.set(null);
  }
}
