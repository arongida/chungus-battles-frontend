import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { InfoContent } from '../models/info-content';
import { HintModalComponent, HintModalData, HintModalResult } from '../components/hint-modal/hint-modal.component';

@Injectable({ providedIn: 'root' })
export class InfoBoxService {
  private platformId = inject(PLATFORM_ID);
  private dialog = inject(MatDialog);

  private static readonly HINTS_ENABLED_KEY = 'hintsEnabled';
  private static readonly DISMISSED_HINTS_KEY = 'dismissedHints';
  private static isLocalStorageAvailable = typeof localStorage !== 'undefined';

  /** Hint modals that should never pop up on touch devices — pure noise there or redundant with on-screen UI. */
  private static readonly MOBILE_HIDDEN_HINTS = new Set([
    'choose-character',
    'draft-ready', 'talent-available', 'talent-pick',
    'match-history', 'abandon', 'mute', 'unmute',
    'battle-won', 'battle-lost', 'battle-draw',
    'run-over', 'version-win', 'top-win',
    'info-box',
    'forfeit', 'volume',
  ]);

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
    // Touch devices have no hover-driven panel to toggle, and the help button instead
    // resets the tutorial (see resetTutorial()) — so hints always stay enabled there.
    this.isVisible.set(this.isTouch ? true : this.loadHintsEnabled());
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
    if (this.isTouch) {
      this.maybeOpenHintModal(content);
    }
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

  /** Clears every dismissed/seen tutorial hint so they all pop up again on next interaction. */
  resetTutorial(): void {
    this.dismissedHints = new Set();
    this.persistDismissedHints();
    this.shownThisSession.clear();
    this.show();
  }

  /**
   * Touch-only gate for action buttons: shows the hint modal on the first tap (with OK / Cancel),
   * then runs the action only when the user taps OK. On later taps (hint already seen this session
   * or dismissed) the action runs immediately without a modal. On non-touch devices the action
   * always runs immediately.
   */
  runGated(content: InfoContent, action: () => void): void {
    if (this.shouldGate(content)) {
      this.openHintDialog(content, true, action);
    } else {
      action();
    }
  }

  private shouldGate(content: InfoContent): boolean {
    if (!this.isTouch || !content.id) return false;
    if (InfoBoxService.MOBILE_HIDDEN_HINTS.has(content.id)) return false;
    if (this.isDismissed(content.id) || this.shownThisSession.has(content.id)) return false;
    return true;
  }

  /**
   * Explicit on-demand open (e.g. a help-icon tap) — bypasses the mobile-hidden/dismissed/session
   * guards that govern passive auto-popups, since a direct request should always show something.
   * Also omits the "Don't show again" checkbox: it re-opens on every tap regardless, so a remember
   * choice there would be misleading.
   */
  showHintModal(content: InfoContent): void {
    if (!content.id || this.dialogOpen) return;
    this.openHintDialog(content, false);
  }

  private maybeOpenHintModal(content: InfoContent): void {
    if (!content.id || !this.isVisible() || this.dialogOpen) return;
    if (InfoBoxService.MOBILE_HIDDEN_HINTS.has(content.id)) return;
    if (this.isDismissed(content.id) || this.shownThisSession.has(content.id)) return;
    this.openHintDialog(content);
  }

  private openHintDialog(content: InfoContent, showRemember = true, onConfirm?: () => void): void {
    if (!content.id) return;
    // Passive info popups (no action) are marked as seen immediately so they don't re-pop this
    // session. Action-gated modals only get suppressed when the user explicitly checks
    // "Don't show again" — otherwise they keep appearing on every tap.
    if (!onConfirm) this.shownThisSession.add(content.id);
    this.dialogOpen = true;
    const dialogRef = this.dialog.open<HintModalComponent, HintModalData, HintModalResult>(HintModalComponent, {
      data: { content, showRemember, hasAction: !!onConfirm },
      panelClass: 'hint-modal-panel',
      maxWidth: '90vw',
      width: '320px',
      autoFocus: false,
    });
    dialogRef.afterClosed().subscribe(result => {
      this.dialogOpen = false;
      if (result?.dontShowAgain && content.id) {
        this.dismiss(content.id);
        this.shownThisSession.add(content.id);
      }
      if (result?.proceed && onConfirm) {
        onConfirm();
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
