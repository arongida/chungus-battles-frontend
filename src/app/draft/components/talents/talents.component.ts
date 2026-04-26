import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, signal } from '@angular/core';
import { Talent } from '../../../models/colyseus-schema/TalentSchema';
import { MatButtonModule } from '@angular/material/button';
import { NgClass } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DraftService } from '../../services/draft.service';
import { SoundOptions, SoundsService } from '../../../common/services/sounds.service';
import { InfoHintDirective } from '../../../common/directives/info-hint.directive';
import { InfoContent } from '../../../common/models/info-content';

@Component({
  selector: 'app-talents',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, NgClass, InfoHintDirective],
  templateUrl: './talents.component.html',
  styleUrl: './talents.component.scss',
})
export class TalentsComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) talentsList: Talent[] = [];
  @Output() panelClosed = new EventEmitter<void>();
  @Output() talentChosen = new EventEmitter<void>();

  hoverTelentRefresh = false;
  talents = signal<Talent[]>([]);
  talentRerollCost = signal<number>(0);

  private stateCallback: ((state: any) => void) | undefined;

  constructor(public draftService: DraftService, private soundsService: SoundsService) {
    const currentState = this.draftService.room?.state;
    if (currentState) {
      this.talentRerollCost.set(currentState.talentRerollCost ?? 0);
    }
    this.stateCallback = (state: any) => {
      this.talentRerollCost.set(state.talentRerollCost ?? 0);
    };
    this.draftService.room?.onStateChange(this.stateCallback);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['talentsList']) {
      this.talents.set([...this.talentsList]);
    }
  }

  ngOnDestroy() {
    if (this.stateCallback) {
      (this.draftService.room?.onStateChange as any).remove?.(this.stateCallback);
    }
  }

  getTalentHint(talent: Talent): InfoContent {
    const cost = this.talentRerollCost();
    const rerollText = cost === 0
      ? 'Free reroll available — use the button below.'
      : `Reroll for ${cost} 🟡 using the button below.`;

    const statEntries = this.buildStatEntries(talent);

    return {
      title: talent.name,
      entries: [
        { icon: '🌟', text: talent.description },
        { icon: '⚡', label: 'Triggers', text: talent.triggerTypes.join(', ') || '—' },
        ...statEntries,
        { icon: '🔄', label: 'Reroll', text: rerollText },
      ],
    };
  }

  private buildStatEntries(talent: Talent): { icon: string; label: string; text: string; color?: string }[] {
    const entries: { icon: string; label: string; text: string; color?: string }[] = [];
    const s = talent.affectedStats;
    const e = talent.affectedEnemyStats;

    const fmt = (v: number) => (v > 0 ? `+${v}` : `${v}`);

    if (s?.strength)         entries.push({ icon: '⚔️', label: 'Strength',     text: `${fmt(s.strength)} to max damage roll`,          color: 'text-red-400' });
    if (s?.accuracy)         entries.push({ icon: '🎯', label: 'Accuracy',     text: `${fmt(s.accuracy)} to min damage roll`,          color: 'text-red-400' });
    if (s?.attackSpeed && s.attackSpeed !== 1) entries.push({ icon: '⏩', label: 'Attack Speed', text: `${fmt(Math.round((s.attackSpeed - 1) * 100))}% speed bonus`, color: 'text-blue-400' });
    if (s?.maxHp)            entries.push({ icon: '❤️', label: 'Max HP',       text: `${fmt(s.maxHp)} max health`,                     color: 'text-pink-400' });
    if (s?.defense)          entries.push({ icon: '🛡️', label: 'Defense',      text: `${fmt(s.defense)} defense`,                      color: 'text-green-400' });
    if (s?.dodgeRate)        entries.push({ icon: '🦵', label: 'Dodge',        text: `${fmt(s.dodgeRate)} dodge rating`,               color: 'text-green-400' });
    if (s?.flatDmgReduction) entries.push({ icon: '🔰', label: 'Flat DR',      text: `${fmt(s.flatDmgReduction)} flat damage reduction`, color: 'text-green-400' });
    if (s?.income)           entries.push({ icon: '💰', label: 'Income',       text: `${fmt(s.income)} gold per fight`,                color: 'text-yellow-400' });
    if (s?.hpRegen)          entries.push({ icon: '🧪', label: 'HP Regen',     text: `${fmt(s.hpRegen)} HP per second`,                color: 'text-orange-400' });

    if (e?.strength)         entries.push({ icon: '⚔️', label: 'Enemy Strength',     text: `${fmt(e.strength)} enemy max damage`,    color: 'text-gray-400' });
    if (e?.accuracy)         entries.push({ icon: '🎯', label: 'Enemy Accuracy',     text: `${fmt(e.accuracy)} enemy min damage`,    color: 'text-gray-400' });
    if (e?.attackSpeed && e.attackSpeed !== 1) entries.push({ icon: '⏩', label: 'Enemy Speed', text: `${fmt(Math.round((e.attackSpeed - 1) * 100))}% enemy speed bonus`, color: 'text-gray-400' });
    if (e?.maxHp)            entries.push({ icon: '❤️', label: 'Enemy HP',           text: `${fmt(e.maxHp)} enemy max health`,       color: 'text-gray-400' });
    if (e?.defense)          entries.push({ icon: '🛡️', label: 'Enemy Defense',      text: `${fmt(e.defense)} enemy defense`,        color: 'text-gray-400' });

    return entries;
  }

  getTalentImage(talent: Talent) {
    return talent.image ? talent.image : 'assets/talent_tablet_01_horizontal.png';
  }

  onMouseEnterTalent(talent: Talent) {
    talent.showDetails = true;
    talent.imageCache = talent.image;
    talent.image = 'assets/talent_tablet_01_horizontal.png';
  }

  onMouseLeaveTalent(talent: Talent) {
    talent.showDetails = false;
    talent.image = talent.imageCache!;
  }

  switchTalentRefreshAnimate() {
    this.hoverTelentRefresh = !this.hoverTelentRefresh;
  }

  selectTalent(talentId: number) {
    this.draftService.sendMessage('select_talent', { talentId });
    this.talentChosen.emit();
  }

  close() {
    this.panelClosed.emit();
  }

  refreshTalents() {
    this.soundsService.playSound(SoundOptions.CLICK);
    this.draftService.sendMessage('refresh_talents', {});
  }
}
