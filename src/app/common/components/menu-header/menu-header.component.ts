import { Component, inject, input, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { InfoBoxService } from '../../services/info-box.service';
import { SoundsService } from '../../services/sounds.service';
import { hasAdminSecret } from '../../utils/admin-secret';

/** Out-of-run pages the header links between. The button for the current page is hidden. */
export type MenuPage = 'home' | 'leaderboard' | 'admin';

/** Top-right icon bar shared by the main menu, the leaderboard and the admin panel: home,
 *  encyclopedia, leaderboard, admin (only once an admin secret is stored), help, volume. */
@Component({
  selector: 'app-menu-header',
  standalone: true,
  imports: [RouterLink, MatIconModule, MatButtonModule],
  template: `
    <div class="fixed top-1 right-2 sm:top-5 sm:right-5 z-20 flex items-center">
      @if (page() !== 'home') {
        <button mat-icon-button class="text-gray-400" routerLink="/" aria-label="Main menu" title="Main menu">
          <mat-icon>home</mat-icon>
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
})
export class MenuHeaderComponent {
  page = input.required<MenuPage>();
  /** The admin panel keeps the hint box off, so it hides the help toggle too. */
  showHelp = input(true);

  readonly soundsService = inject(SoundsService);
  private readonly infoBoxService = inject(InfoBoxService);
  private readonly dialog = inject(MatDialog);

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
