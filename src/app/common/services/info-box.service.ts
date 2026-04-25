import { Injectable, signal } from '@angular/core';
import { InfoContent } from '../models/info-content';

@Injectable({ providedIn: 'root' })
export class InfoBoxService {
  readonly isVisible = signal<boolean>(true);
  readonly currentContent = signal<InfoContent | null>(null);

  toggle(): void {
    this.isVisible.update(v => !v);
  }

  setContent(content: InfoContent): void {
    this.currentContent.set(content);
  }

  clearContent(): void {
    this.currentContent.set(null);
  }
}
