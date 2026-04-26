import { Component, Input } from '@angular/core';
import { Player } from '../../../models/colyseus-schema/PlayerSchema';
import { MatIconModule } from '@angular/material/icon';
import { InfoHintDirective } from '../../directives/info-hint.directive';
import { InfoContent } from '../../models/info-content';
import { Talent } from '../../../models/colyseus-schema/TalentSchema';
import { AffectedStats } from '../../../models/colyseus-schema/AffectedStatsSchema';

@Component({
  selector: 'app-skill-icons',
  standalone: true,
  imports: [MatIconModule, InfoHintDirective],
  templateUrl: './skill-icons.component.html',
  styleUrl: './skill-icons.component.scss',
})
export class SkillIconsComponent {
  @Input({ required: true }) player: Player = new Player();

  getTalentHint(talent: Talent): InfoContent {
    return {
      title: talent.name,
      entries: [
        { icon: '🌟', text: talent.description },
        { icon: '⚡', label: 'Triggers', text: talent.triggerTypes.join(', ') || '—' },
        ...this.buildStatEntries(talent.affectedStats, talent.affectedEnemyStats),
      ],
    };
  }

  private buildStatEntries(s: AffectedStats, e: AffectedStats): { icon: string; label: string; text: string; color?: string }[] {
    const entries: { icon: string; label: string; text: string; color?: string }[] = [];
    const fmt = (v: number) => (v > 0 ? `+${v}` : `${v}`);

    if (s?.strength)         entries.push({ icon: '⚔️', label: 'Strength',     text: `${fmt(s.strength)} to max damage roll`,                   color: 'text-red-400' });
    if (s?.accuracy)         entries.push({ icon: '🎯', label: 'Accuracy',     text: `${fmt(s.accuracy)} to min damage roll`,                   color: 'text-red-400' });
    if (s?.attackSpeed && s.attackSpeed !== 1) entries.push({ icon: '⏩', label: 'Attack Speed', text: `${fmt(Math.round((s.attackSpeed - 1) * 100))}% speed bonus`, color: 'text-blue-400' });
    if (s?.maxHp)            entries.push({ icon: '❤️', label: 'Max HP',       text: `${fmt(s.maxHp)} max health`,                              color: 'text-pink-400' });
    if (s?.defense)          entries.push({ icon: '🛡️', label: 'Defense',      text: `${fmt(s.defense)} defense`,                               color: 'text-green-400' });
    if (s?.dodgeRate)        entries.push({ icon: '🦵', label: 'Dodge',        text: `${fmt(s.dodgeRate)} dodge rating`,                        color: 'text-green-400' });
    if (s?.flatDmgReduction) entries.push({ icon: '🔰', label: 'Flat DR',      text: `${fmt(s.flatDmgReduction)} flat damage reduction`,         color: 'text-green-400' });
    if (s?.income)           entries.push({ icon: '💰', label: 'Income',       text: `${fmt(s.income)} gold per fight`,                         color: 'text-yellow-400' });
    if (s?.hpRegen)          entries.push({ icon: '🧪', label: 'HP Regen',     text: `${fmt(s.hpRegen)} HP per second`,                         color: 'text-orange-400' });

    if (e?.strength)         entries.push({ icon: '⚔️', label: 'Enemy Strength', text: `${fmt(e.strength)} enemy max damage`,    color: 'text-gray-400' });
    if (e?.accuracy)         entries.push({ icon: '🎯', label: 'Enemy Accuracy', text: `${fmt(e.accuracy)} enemy min damage`,    color: 'text-gray-400' });
    if (e?.attackSpeed && e.attackSpeed !== 1) entries.push({ icon: '⏩', label: 'Enemy Speed', text: `${fmt(Math.round((e.attackSpeed - 1) * 100))}% enemy speed bonus`, color: 'text-gray-400' });
    if (e?.maxHp)            entries.push({ icon: '❤️', label: 'Enemy HP',       text: `${fmt(e.maxHp)} enemy max health`,       color: 'text-gray-400' });
    if (e?.defense)          entries.push({ icon: '🛡️', label: 'Enemy Defense',  text: `${fmt(e.defense)} enemy defense`,        color: 'text-gray-400' });

    return entries;
  }
}
