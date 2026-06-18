import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FightService } from '../../../fight/services/fight.service';
import { environment } from '../../../../environments/environment';
import { Player } from '../../../models/colyseus-schema/PlayerSchema';
import { buildPlayerFromData } from '../../utils/player-schema-builder';
import { PlayerBuildCardComponent } from '../player-build-card/player-build-card.component';

interface LeaderboardEntry {
  playerId: number;
  name: string;
  avatarUrl: string;
  round: number;
  level: number;
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
  imports: [FormsModule, MatButtonModule, MatIconModule, PlayerBuildCardComponent],
  templateUrl: './next-fight-picker.component.html',
  styleUrl: './next-fight-picker.component.scss',
})
export class NextFightPickerComponent {
  private fightService = inject(FightService);

  open = signal(false);
  loading = signal(false);
  searchName = signal('');
  filterLevel = signal<string>('');
  readonly levelOptions = [1, 2, 3, 4, 5];
  results = signal<LeaderboardEntry[]>([]);

  expandedId = signal<number | null>(null);
  builds = signal<Map<number, Player>>(new Map());
  buildLoading = signal<number | null>(null);

  selectedEnemyId = this.fightService.selectedEnemyId;
  selectedEnemyName = this.fightService.selectedEnemyName;

  private nameDebounceTimer: any;

  togglePicker(): void {
    this.open.update(v => !v);
    if (this.open()) this.search();
  }

  close(): void {
    this.open.set(false);
    this.expandedId.set(null);
  }

  onSearchInput(value: string): void {
    this.searchName.set(value);
    clearTimeout(this.nameDebounceTimer);
    this.nameDebounceTimer = setTimeout(() => this.search(), 300);
  }

  onLevelChange(value: string): void {
    this.filterLevel.set(value);
    this.search();
  }

  async search(): Promise<void> {
    this.loading.set(true);
    try {
      const params = new URLSearchParams({ limit: '20' });
      if (this.searchName().trim()) params.set('name', this.searchName().trim());
      if (this.filterLevel()) params.set('level', this.filterLevel());
      const result = await fetch(`${environment.gameServer}/leaderboard?${params}`).then(r => r.json());
      this.results.set(Array.isArray(result?.players) ? result.players : []);
    } catch (error) {
      console.error('[NextFightPicker] Error fetching leaderboard:', error);
      this.results.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  async toggleRow(entry: LeaderboardEntry): Promise<void> {
    if (this.expandedId() === entry.playerId) {
      this.expandedId.set(null);
      return;
    }
    this.expandedId.set(entry.playerId);
    if (this.builds().has(entry.playerId)) return;
    this.buildLoading.set(entry.playerId);
    try {
      const data = await fetch(`${environment.gameServer}/playerBuild?playerId=${entry.playerId}`).then(r => r.json());
      const player = buildPlayerFromData(data);
      this.builds.update(m => new Map(m).set(entry.playerId, player));
    } catch (error) {
      console.error('[NextFightPicker] Error fetching build:', error);
    } finally {
      this.buildLoading.set(null);
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
