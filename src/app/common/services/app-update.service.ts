import { DestroyRef, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

/** Routes where nothing live is in progress, so a silent full reload is invisible to the player. */
const OUT_OF_RUN_ROUTE = /^\/(end|admin|replay)?(\/|;|\?|$)/;

/**
 * Detects that a newer frontend build has been deployed while this tab was open, so players
 * don't keep running a stale bundle against a backend whose Colyseus schema / messages moved on
 * (skipHandshake makes a schema mismatch decode silently wrong, not fail loudly).
 *
 * No build-step version stamp needed: the production build's entry bundle is content-hashed
 * (main-<hash>.js), so a fresh, uncached index.html referencing a different main-*.js means a new
 * deploy. The dev server serves an unhashed main.js, so the check is inert there.
 *
 * When stale: out-of-run navigations (home, end, admin, replay) turn into a real page load, so
 * the update is picked up without the player noticing; inside a run (draft/fight) the app only
 * shows a Refresh banner (reloading there is safe — rooms resume from the stored reconnect
 * token — but it shouldn't happen unasked mid-fight).
 */
@Injectable({ providedIn: 'root' })
export class AppUpdateService {
  readonly updateAvailable = signal(false);

  private static readonly POLL_INTERVAL_MS = 5 * 60_000;
  private static readonly MIN_CHECK_GAP_MS = 30_000;
  private static readonly MAIN_BUNDLE = /main-[A-Za-z0-9]+\.js/;

  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private loadedBundle: string | null = null;
  private lastCheckAt = 0;

  start(): void {
    if (!this.isBrowser) return;
    this.loadedBundle = this.currentBundle();
    if (!this.loadedBundle) return; // dev server (unhashed main.js) — nothing to compare

    const timer = setInterval(() => this.check(), AppUpdateService.POLL_INTERVAL_MS);
    const onVisible = () => { if (document.visibilityState === 'visible') this.check(); };
    document.addEventListener('visibilitychange', onVisible);
    const nav = this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe(e => {
      if (this.updateAvailable() && OUT_OF_RUN_ROUTE.test(e.urlAfterRedirects)) {
        window.location.reload();
        return;
      }
      this.check();
    });
    this.destroyRef.onDestroy(() => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      nav.unsubscribe();
    });
  }

  reload(): void {
    window.location.reload();
  }

  private currentBundle(): string | null {
    for (const script of Array.from(document.querySelectorAll('script[src]'))) {
      const match = script.getAttribute('src')?.match(AppUpdateService.MAIN_BUNDLE);
      if (match) return match[0];
    }
    return null;
  }

  private async check(): Promise<void> {
    if (this.updateAvailable()) return;
    const now = Date.now();
    if (now - this.lastCheckAt < AppUpdateService.MIN_CHECK_GAP_MS) return;
    this.lastCheckAt = now;
    try {
      // document.baseURI is the app root (base-href aware — /chungus-battles-frontend/ on Pages).
      const res = await fetch(new URL('index.html', document.baseURI).href, { cache: 'no-store' });
      if (!res.ok) return;
      const latest = (await res.text()).match(AppUpdateService.MAIN_BUNDLE)?.[0];
      if (latest && latest !== this.loadedBundle) this.updateAvailable.set(true);
    } catch {
      // Offline or a transient failure — try again on the next trigger.
    }
  }
}
