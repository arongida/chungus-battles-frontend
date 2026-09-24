import { Component, computed, inject, input, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { InfoBoxService } from '../../services/info-box.service';
import { SoundsService } from '../../services/sounds.service';
import { hasAdminSecret } from '../../utils/admin-secret';
import { MatBadgeModule } from '@angular/material/badge';
import { GhostReportService } from '../../services/ghost-report.service';
import { RunRegistryService } from '../../services/run-registry.service';
import { GhostReportDialogComponent } from '../ghost-report-dialog/ghost-report-dialog.component';

/** Out-of-run pages the header links between. The button for the current page is hidden. */
export type MenuPage = 'home' | 'leaderboard' | 'admin';

/** Top-right icon bar shared by the main menu, the leaderboard and the admin panel: home,
 *  ghost inbox (once this browser has a run), encyclopedia, leaderboard, admin (only once an
 *  admin secret is stored), help, volume. */
@Component({
  selector: 'app-menu-header',
  standalone: true,
  imports: [RouterLink, MatIconModule, MatButtonModule, MatBadgeModule],
  template: `
    <div class="fixed top-1 right-2 sm:top-5 sm:right-5 z-20 flex items-center">
      @if (page() !== 'home') {
        <button mat-icon-button class="text-gray-400" routerLink="/" aria-label="Main menu" title="Main menu">
          <mat-icon>home</mat-icon>
        </button>
      }
      @if (hasRuns()) {
        <button mat-icon-button class="text-gray-400" (click)="openGhostInbox()" aria-label="Ghost report"
          title="Your ghosts: how other players fared against them, and what they said"
          [matBadge]="ghostReportService.unseenTotal() || null" matBadgeSize="small" matBadgeColor="warn"
          [matBadgeHidden]="!ghostReportService.unseenTotal()">
          <span class="menu-emoji-icon">👻</span>
        </button>
      }
      <button mat-icon-button class="text-gray-400" (click)="openEncyclopedia()" aria-label="Encyclopedia" title="Encyclopedia">
        <mat-icon>menu_book</mat-icon>
      </button>
      @if (page() !== 'leaderboard') {
        <button mat-icon-button class="text-gray-400" routerLink="/end" aria-label="Leaderboard" title="Leaderboard">
          <mat-icon>leaderboard</mat-icon>
        </button>
      }
      @if (page() !== 'admin' && isAdmin()) {
        <button mat-icon-button class="text-gray-400" routerLink="/admin" aria-label="Admin panel" title="Admin panel">
          <mat-icon>admin_panel_settings</mat-icon>
        </button>
      }
      @if (showHelp()) {
        <button mat-icon-button (click)="toggleInfoBox()" aria-label="Help" title="Help"
          [class.text-amber-400]="infoBoxHighlighted()"
          [class.text-gray-400]="!infoBoxHighlighted()"
          [class.ring-1]="infoBoxHighlighted()"
          [class.ring-amber-400]="infoBoxHighlighted()"
          [class.rounded-full]="infoBoxHighlighted()">
          <mat-icon>{{ infoBoxHighlighted() ? 'help' : 'help_outline' }}</mat-icon>
        </button>
      }
      <button mat-icon-button class="text-gray-400" (click)="soundsService.cycleVolume()" aria-label="Change volume" title="Volume">
        <mat-icon>{{ soundsService.volumeIcon }}</mat-icon>
      </button>
    </div>
  `,
  // Emoji glyphs sit on the text baseline; give it the same 24×24 centered box a <mat-icon>
  // has so it lines up with the neighbouring icons.
  styles: [`
    .menu-emoji-icon {
      display: block;
      margin: 0 auto;
      /* Block-centered in the button, then nudged to where <mat-icon> glyphs actually sit
         (their baseline puts them ~2px below center). Not vertical-align: an emoji's
         baseline depends on the OS emoji font, so that offset differs per platform. */
      position: relative;
      top: 2px;
      width: 24px;
      height: 24px;
      font-size: 20px;
      line-height: 24px;
      text-align: center;
      text-shadow: none;
    }
  `],
})
export class MenuHeaderComponent implements OnInit {
  page = input.required<MenuPage>();
  /** The admin panel keeps the hint box off, so it hides the help toggle too. */
  showHelp = input(true);

  readonly soundsService = inject(SoundsService);
  private readonly infoBoxService = inject(InfoBoxService);
  private readonly dialog = inject(MatDialog);
  readonly ghostReportService = inject(GhostReportService);
  private readonly runRegistry = inject(RunRegistryService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly hasRuns = computed(() => this.runRegistry.runs().length > 0);

  ngOnInit(): void {
    if (this.isBrowser && this.hasRuns()) this.ghostReportService.refreshUnseenCounts();
  }

  /** Every run stored in this browser, in one list — the ghost report outside of a run. */
  openGhostInbox(): void {
    this.dialog.open(GhostReportDialogComponent, {
      data: {},
      backdropClass: 'chungus-dialog-backdrop',
      autoFocus: false,
    });
  }

  /** Read once per page visit: the secret only changes on the admin page, which never shows
   *  its own admin button. */
  readonly isAdmin = signal(isPlatformBrowser(inject(PLATFORM_ID)) && hasAdminSecret());

  /** On touch, hints stay enabled at all times (see toggleInfoBox), so the highlight would
   *  always be on and falsely imply an active hover-hint mode that doesn't exist there. */
  infoBoxHighlighted(): boolean {
    return !this.infoBoxService.isTouch && this.infoBoxService.isVisible();
  }

  toggleInfoBox(): void {
    // The hint side panel never renders on touch, so the question-mark button there
    // instead opens the page's hint as a modal on demand.
    if (this.infoBoxService.isTouch) {
      const content = this.infoBoxService.pageDefault();
      if (content) this.infoBoxService.showHintModal(content);
      return;
    }
    this.infoBoxService.toggle();
  }

  // Lazy-loaded so the encyclopedia (+ item-card, hover-card) doesn't bloat the menu pages'
  // initial bundle — it's opened rarely and the browser catalog is session-free.
  async openEncyclopedia(): Promise<void> {
    const { EncyclopediaComponent } = await import(
      '../../../draft/components/encyclopedia/encyclopedia.component'
    );
    this.dialog.open(EncyclopediaComponent, {
      maxWidth: '100vw',
      maxHeight: '100vh',
      height: '100%',
      width: '80%',
      backdropClass: 'chungus-dialog-backdrop',
      autoFocus: false,
    });
  }
}
