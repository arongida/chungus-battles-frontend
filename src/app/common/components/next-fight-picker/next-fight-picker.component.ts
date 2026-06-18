import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FightService } from '../../../fight/services/fight.service';
import { environment } from '../../../../environments/environment';

interface LeaderboardEntry {
  playerId: number;
  name: string;
  avatarUrl: string;
  round: number;
  wins: number;
}

/**
 * Dev-only debug tool ("next fight picker"): lets you search stored players from the
 * /leaderboard endpoint and force the next fight to be against a specific one, instead of
 * random same-round matchmaking. Only rendered when environment.enemyPicker is true
 * (see draft-toolbar.component.html) — never shipped in the production build's UI, and the
 * backend additionally ignores the override outside of NODE_ENV !== 'production'.
 */
@Component({
  selector: 'app-next-fight-picker',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatIconModule],
  templateUrl: './next-fight-picker.component.html',
  styleUrl: './next-fight-picker.component.scss',
})
export class NextFightPickerComponent {
  private fightService = inject(FightService);

  open = signal(false);
  loading = signal(false);
  searchName = signal('');
  results = signal<LeaderboardEntry[]>([]);

  selectedEnemyId = this.fightService.selectedEnemyId;
  selectedEnemyName = this.fightService.selectedEnemyName;

  private nameDebounceTimer: any;

  togglePicker(): void {
    this.open.update(v => !v);
    if (this.open()) this.search();
  }

  close(): void {
    this.open.set(false);
  }

  onSearchInput(value: string): void {
    this.searchName.set(value);
    clearTimeout(this.nameDebounceTimer);
    this.nameDebounceTimer = setTimeout(() => this.search(), 300);
  }

  async search(): Promise<void> {
    this.loading.set(true);
    try {
      const params = new URLSearchParams({ limit: '20' });
      if (this.searchName().trim()) params.set('name', this.searchName().trim());
      const result = await fetch(`${environment.gameServer}/leaderboard?${params}`).then(r => r.json());
      this.results.set(Array.isArray(result?.players) ? result.players : []);
    } catch (error) {
      console.error('[NextFightPicker] Error fetching leaderboard:', error);
      this.results.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  select(entry: LeaderboardEntry): void {
    this.fightService.selectedEnemyId.set(entry.playerId);
    this.fightService.selectedEnemyName.set(entry.name);
    this.close();
  }

  clearSelection(): void {
    this.fightService.selectedEnemyId.set(null);
    this.fightService.selectedEnemyName.set(null);
  }
}
