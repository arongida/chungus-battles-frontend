import { Component, Inject, Input, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, NgClass } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';

/** The Ko-fi "support the server" link, shared by the join screen and the end screen so both
 *  always point at the same page and get the same mobile handling in one place.
 *
 *  itch.io's embed (see itch/index.html) nests this app in a *cross-origin* iframe inside itch's
 *  own sandboxed frame. Mobile Safari/Chrome routinely swallow a `target="_blank"` navigation
 *  from a doubly-nested frame like that — nothing visibly happens on tap. When running top-level
 *  (the normal case — GitHub Pages, fly.dev direct) this component is a plain anchor and nothing
 *  here runs; the nested-frame handling only kicks in when `window.self !== window.top`. */
@Component({
  selector: 'app-support-link',
  standalone: true,
  imports: [NgClass],
  templateUrl: './support-link.component.html',
  styleUrl: './support-link.component.scss',
})
export class SupportLinkComponent {
  /** Extra classes for the inner anchor (e.g. `text-white` on the end screen's dark backdrop). */
  @Input() extraClass = '';

  readonly url = 'https://ko-fi.com/chungusbattles';

  constructor(
    private snackBar: MatSnackBar,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  onClick(event: MouseEvent): void {
    if (!isPlatformBrowser(this.platformId) || window.self === window.top) {
      // Top-level page — let the native target="_blank" anchor behavior handle it.
      return;
    }
    event.preventDefault();
    const opened = window.open(this.url, '_blank', 'noopener');
    if (opened) return;
    // window.open blocked too — offer a copyable link instead of a dead tap.
    const ref = this.snackBar.open(`Support the server: ${this.url}`, 'Copy', {
      duration: 8000,
      panelClass: 'chungus-snackbar',
    });
    ref.onAction().subscribe(() => {
      navigator.clipboard?.writeText(this.url).catch(() => {});
    });
  }
}
