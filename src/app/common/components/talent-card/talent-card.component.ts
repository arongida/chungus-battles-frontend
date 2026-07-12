import { Component, Input } from '@angular/core';
import { Talent } from '../../../models/colyseus-schema/TalentSchema';
import { AffectedStats } from '../../../models/colyseus-schema/AffectedStatsSchema';

@Component({
  selector: 'app-talent-card',
  standalone: true,
  templateUrl: './talent-card.component.html',
  styleUrl: './talent-card.component.scss',
})
export class TalentCardComponent {
  @Input({ required: true }) talent!: Talent;

  hasSelfStats(s: AffectedStats): boolean {
    if (!s) return false;
    return !!(s.strength || s.accuracy || (s.attackSpeed && s.attackSpeed !== 1) ||
              s.maxHp || s.defense || s.dodgeRate || s.income || s.hpRegen);
  }

  hasEnemyStats(e: AffectedStats): boolean {
    if (!e) return false;
    return !!(e.strength || e.accuracy || (e.attackSpeed && e.attackSpeed !== 1) ||
              e.maxHp || e.defense || e.dodgeRate);
  }

  fmt(v: number): string {
    return v > 0 ? `+${v}` : `${v}`;
  }

  speedPct(v: number): string {
    const pct = Math.round((v - 1) * 100);
    return pct > 0 ? `+${pct}%` : `${pct}%`;
  }

  hasCombatStats(): boolean {
    return !!(this.talent.statActivations || this.talent.statDamageDealt || this.talent.statHealingDone || this.talent.statHealingPrevented || this.talent.statGoldGained || this.talent.statXpGained);
  }

  hasTotalStats(): boolean {
    return !!(this.talent.totalActivations || this.talent.totalDamageDealt || this.talent.totalHealingDone || this.talent.totalHealingPrevented || this.talent.totalGoldGained || this.talent.totalXpGained);
  }

  fmt2(v: number): string {
    return parseFloat(v.toFixed(2)).toString();
  }

  triggerLabel(): string {
    const arr = this.talent?.triggerTypes;
    if (!arr) return '—';
    const joined = typeof arr.join === 'function' ? arr.join(', ') : '';
    return joined || '—';
  }
}
