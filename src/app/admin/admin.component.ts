import { Component, Inject, OnDestroy, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { environment } from '../../environments/environment';
import { SeasonsService } from '../common/services/seasons.service';
import { Tournament, TournamentSummary } from '../models/types/MessageTypes';

const SECRET_STORAGE_KEY = 'adminSecret';

/**
 * Season-end tournament admin panel. Gated by an admin secret the operator sets themselves
 * (in localStorage, via the form below or devtools directly) — the panel is otherwise public;
 * the real boundary is the backend's x-admin-secret check on POST /admin/tournament and
 * POST /admin/pruneReplays (see app.config.ts). GET /tournament and GET /tournaments need no
 * auth, so the panel can always show status even before a secret is set.
 */
@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatCheckboxModule, RouterLink],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
})
export class AdminComponent implements OnInit, OnDestroy {
  secret = signal<string>('');
  secretInput = signal<string>('');
  authError = signal<string | null>(null);

  seasonOptions = signal<{ label: string; value: number }[]>([]);
  season = signal<number>(0);

  tournament = signal<Tournament | null>(null);
  tournamentSummaries = signal<TournamentSummary[]>([]);
  forceRestart = signal(false);

  running = signal(false);
  actionError = signal<string | null>(null);

  pruning = signal(false);
  pruneResult = signal<string | null>(null);

  private pollId: any = null;

  constructor(
    private seasonsService: SeasonsService,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const stored = localStorage.getItem(SECRET_STORAGE_KEY);
      if (stored) this.secret.set(stored);
    }

    this.seasonsService.getSeasons().then(data => {
      this.seasonOptions.set(data.seasons.map(s => ({ label: `Season ${s.number} — ${s.name}`, value: s.number })));
      this.season.set(data.currentSeason);
      this.refreshTournament();
    });
    this.fetchSummaries();
  }

  ngOnDestroy(): void {
    if (this.pollId) clearInterval(this.pollId);
  }

  saveSecret(): void {
    const value = this.secretInput().trim();
    if (!value || !isPlatformBrowser(this.platformId)) return;
    localStorage.setItem(SECRET_STORAGE_KEY, value);
    this.secret.set(value);
    this.secretInput.set('');
    this.authError.set(null);
  }

  clearSecret(): void {
    if (isPlatformBrowser(this.platformId)) localStorage.removeItem(SECRET_STORAGE_KEY);
    this.secret.set('');
  }

  setSeason(value: string): void {
    this.season.set(Number(value));
    this.forceRestart.set(false);
    this.actionError.set(null);
    this.pruneResult.set(null);
    this.refreshTournament();
  }

  private async fetchSummaries(): Promise<void> {
    try {
      const res = await fetch(`${environment.gameServer}/tournaments`);
      this.tournamentSummaries.set(res.ok ? await res.json() : []);
    } catch {
      this.tournamentSummaries.set([]);
    }
  }

  async refreshTournament(): Promise<void> {
    const season = this.season();
    if (!season) return;
    try {
      const res = await fetch(`${environment.gameServer}/tournament?season=${season}`);
      const t = res.ok ? (await res.json() as Tournament) : null;
      this.tournament.set(t);
      this.managePolling(t);
    } catch {
      this.tournament.set(null);
    }
  }

  /** Polls while a run is actively in progress (this season, this backend) — same 5s cadence
   *  end.component.ts's fetchPlayerData already uses elsewhere in this app. */
  private managePolling(t: Tournament | null): void {
    if (t?.status === 'running') {
      if (!this.pollId) this.pollId = setInterval(() => this.refreshTournament(), 5000);
    } else if (this.pollId) {
      clearInterval(this.pollId);
      this.pollId = null;
    }
  }

  actionLabel(): string {
    const t = this.tournament();
    if (!t) return 'Start Tournament';
    if (t.status === 'complete') return 'Re-run From Scratch';
    if (t.status === 'skipped') return 'Fewer Than 2 Winners';
    return 'Resume Tournament'; // running (shouldn't reach the button — see canRun) or failed
  }

  canRun(): boolean {
    const t = this.tournament();
    if (!t) return true;
    if (t.status === 'complete') return this.forceRestart();
    if (t.status === 'skipped') return false;
    return true; // failed — always resumable; running is hidden behind the progress view instead
  }

  async runTournament(): Promise<void> {
    if (!this.secret()) return;
    this.running.set(true);
    this.actionError.set(null);
    try {
      const res = await fetch(`${environment.gameServer}/admin/tournament`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': this.secret() },
        body: JSON.stringify({ season: this.season(), force: this.forceRestart() }),
      });
      if (res.status === 401) {
        this.clearSecret();
        this.authError.set('Admin secret rejected — set it again below.');
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        this.actionError.set(data.error ?? `Request failed (HTTP ${res.status})`);
        return;
      }
      this.forceRestart.set(false);
      await this.refreshTournament();
      await this.fetchSummaries();
    } catch {
      this.actionError.set('Network error — is the backend reachable?');
    } finally {
      this.running.set(false);
    }
  }

  async pruneReplays(): Promise<void> {
    if (!this.secret()) return;
    if (!confirm(`Permanently strip fight recordings from every ordinary replay of Season ${this.season()}? This cannot be undone. Tournament replays are never touched.`)) return;
    this.pruning.set(true);
    this.actionError.set(null);
    this.pruneResult.set(null);
    try {
      const res = await fetch(`${environment.gameServer}/admin/pruneReplays`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': this.secret() },
        body: JSON.stringify({ season: this.season() }),
      });
      if (res.status === 401) {
        this.clearSecret();
        this.authError.set('Admin secret rejected — set it again below.');
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        this.actionError.set(data.error ?? `Request failed (HTTP ${res.status})`);
        return;
      }
      this.pruneResult.set(`Pruned ${data.modifiedCount} replay(s).`);
    } catch {
      this.actionError.set('Network error — is the backend reachable?');
    } finally {
      this.pruning.set(false);
    }
  }

  progressPct(): number {
    const p = this.tournament()?.progress;
    if (!p || !p.fightsTotal) return 0;
    return Math.min(100, Math.round((p.fightsDone / p.fightsTotal) * 100));
  }

  summaryFor(season: number): TournamentSummary | undefined {
    return this.tournamentSummaries().find(s => s.season === season);
  }
}
