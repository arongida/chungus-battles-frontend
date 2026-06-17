import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { InfoContent } from '../models/info-content';
import { HintModalComponent, HintModalResult } from '../components/hint-modal/hint-modal.component';

@Injectable({ providedIn: 'root' })
export class InfoBoxService {
  private platformId = inject(PLATFORM_ID);
  private dialog = inject(MatDialog);

  private static readonly HINTS_ENABLED_KEY = 'hintsEnabled';
  private static readonly DISMISSED_HINTS_KEY = 'dismissedHints';
  private static isLocalStorageAvailable = typeof localStorage !== 'undefined';

  /** True on touch devices that report no hover support (phones/tablets) — drives the panel-vs-modal split. */
  readonly isTouch: boolean;

  readonly isVisible = signal<boolean>(true);
  readonly currentContent = signal<InfoContent | null>(null);
  readonly pageDefault = signal<InfoContent | null>(null);

  private dismissedHints: Set<string>;
  /** Hints already shown as a modal this session, so an undismissed hint doesn't re-pop on every hover/tap. */
  private readonly shownThisSession = new Set<string>();
  private dialogOpen = false;

  constructor() {
    this.isTouch = isPlatformBrowser(this.platformId) && window.matchMedia('(hover: none)').matches;
    this.isVisible.set(this.loadHintsEnabled());
    this.dismissedHints = this.loadDismissedHints();
  }

  toggle(): void {
    this.isVisible.update(v => !v);
    this.persistHintsEnabled(this.isVisible());
  }

  hide(): void {
    this.isVisible.set(false);
    this.persistHintsEnabled(false);
  }

  show(): void {
    this.isVisible.set(true);
    this.persistHintsEnabled(true);
  }

  private _clearTimer: ReturnType<typeof setTimeout> | null = null;

  setContent(content: InfoContent): void {
    if (this._clearTimer) {
      clearTimeout(this._clearTimer);
      this._clearTimer = null;
    }
    this.currentContent.set(content);

    if (this.isTouch) {
      this.maybeOpenHintModal(content);
    }
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

  isDismissed(id: string): boolean {
    return this.dismissedHints.has(id);
  }

  dismiss(id: string): void {
    if (this.dismissedHints.has(id)) return;
    this.dismissedHints.add(id);
    this.persistDismissedHints();
  }

  private maybeOpenHintModal(content: InfoContent): void {
    if (!content.id || !this.isVisible() || this.dialogOpen) return;
    if (this.isDismissed(content.id) || this.shownThisSession.has(content.id)) return;

    this.shownThisSession.add(content.id);
    this.dialogOpen = true;
    const dialogRef = this.dialog.open<HintModalComponent, InfoContent, HintModalResult>(HintModalComponent, {
      data: content,
      panelClass: 'hint-modal-panel',
      maxWidth: '90vw',
      width: '320px',
      autoFocus: false,
    });
    dialogRef.afterClosed().subscribe(result => {
      this.dialogOpen = false;
      if (result?.dontShowAgain && content.id) {
        this.dismiss(content.id);
      }
    });
  }

  private loadHintsEnabled(): boolean {
    if (!InfoBoxService.isLocalStorageAvailable) return true;
    const saved = localStorage.getItem(InfoBoxService.HINTS_ENABLED_KEY);
    return saved === null ? true : saved === 'true';
  }

  private persistHintsEnabled(value: boolean): void {
    if (!InfoBoxService.isLocalStorageAvailable) return;
    localStorage.setItem(InfoBoxService.HINTS_ENABLED_KEY, String(value));
  }

  private loadDismissedHints(): Set<string> {
    if (!InfoBoxService.isLocalStorageAvailable) return new Set();
    const saved = localStorage.getItem(InfoBoxService.DISMISSED_HINTS_KEY);
    if (!saved) return new Set();
    try {
      const parsed = JSON.parse(saved);
      return new Set(Array.isArray(parsed) ? parsed : []);
    } catch (e) {
      console.error('Error loading dismissed hints from localStorage:', e);
      return new Set();
    }
  }

  private persistDismissedHints(): void {
    if (!InfoBoxService.isLocalStorageAvailable) return;
    localStorage.setItem(InfoBoxService.DISMISSED_HINTS_KEY, JSON.stringify([...this.dismissedHints]));
  }
}
