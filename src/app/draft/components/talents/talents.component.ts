import { Component, computed } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Talent } from '../../../models/colyseus-schema/TalentSchema';
import { MatIconModule } from '@angular/material/icon';
import { DraftService } from '../../services/draft.service';
import { SoundOptions, SoundsService } from '../../../common/services/sounds.service';
import { CharacterDetailsService } from '../../../common/services/character-details.service';
import { InfoHintDirective } from '../../../common/directives/info-hint.directive';
import { InfoContent } from '../../../common/models/info-content';
import { environment } from '../../../../environments/environment';

/**
 * Opened via MatDialog from DraftToolbarComponent (rather than taking talentsList/playerLevel
 * as @Inputs) so it renders in the CDK overlay — immune to the toolbar host's own stacking
 * context — instead of the inline backdrop it used to render via a plain @if block. Reads its
 * data from CharacterDetailsService, which the toolbar keeps mirrored to the player's current
 * talent options/level, including live updates while the dialog is open (e.g. on reroll).
 */
@Component({
  selector: 'app-talents',
  standalone: true,
  imports: [MatDialogModule, MatIconModule, InfoHintDirective],
  templateUrl: './talents.component.html',
  styleUrl: './talents.component.scss',
})
export class TalentsComponent {
  talents = computed(() => this.characterDetailsService.availableTalents());
  talentRerollUsed = computed(() => this.characterDetailsService.talentRerollUsed());
  /** Dev/staging builds get unlimited talent rerolls — mirrors the backend's
   *  NODE_ENV !== 'production' bypass in DraftRoom.handleRefreshTalentSlot. */
  readonly unlimitedReroll = environment.enemyPicker;
  playerLevel = computed(() => this.characterDetailsService.talentPlayerLevel());
  playerAvatarUrl = computed(() => this.characterDetailsService.talentPlayerAvatarUrl());

  constructor(
    public draftService: DraftService,
    private soundsService: SoundsService,
    private characterDetailsService: CharacterDetailsService,
    private dialogRef: MatDialogRef<TalentsComponent>,
  ) {
  }

  getTalentHint(talent: Talent, index: number): InfoContent {
    const rerollText = this.talentRerollUsed()[index] && !this.unlimitedReroll
      ? 'Reroll already used for this slot.'
      : 'Free reroll available — use the arrow on this row.';

    const statEntries = this.buildStatEntries(talent);

    return {
      id: 'talent-pick',
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
    if (s?.income)           entries.push({ icon: '💰', label: 'Income',       text: `${fmt(s.income)} gold per fight`,                color: 'text-yellow-400' });
    if (s?.hpRegen)          entries.push({ icon: '🧪', label: 'HP Regen',     text: `${fmt(s.hpRegen)} HP per second`,                color: 'text-orange-400' });

    if (e?.strength)         entries.push({ icon: '⚔️', label: 'Enemy Strength',     text: `${fmt(e.strength)} enemy max damage`,    color: 'text-gray-400' });
    if (e?.accuracy)         entries.push({ icon: '🎯', label: 'Enemy Accuracy',     text: `${fmt(e.accuracy)} enemy min damage`,    color: 'text-gray-400' });
    if (e?.attackSpeed && e.attackSpeed !== 1) entries.push({ icon: '⏩', label: 'Enemy Speed', text: `${fmt(Math.round((e.attackSpeed - 1) * 100))}% enemy speed bonus`, color: 'text-gray-400' });
    if (e?.maxHp)            entries.push({ icon: '❤️', label: 'Enemy HP',           text: `${fmt(e.maxHp)} enemy max health`,       color: 'text-gray-400' });
    if (e?.defense)          entries.push({ icon: '🛡️', label: 'Enemy Defense',      text: `${fmt(e.defense)} enemy defense`,        color: 'text-gray-400' });

    return entries;
  }

  getTalentImage() {
    return 'assets/talent_tablet_01_horizontal.png';
  }

  /** Reads the authoritative Player.luckyFindChance (base + level scaling + the permanent Lucky
   *  Find Mythic-buy bonus + Black Market Contact's doubling, all applied server-side — see
   *  ShopUpgradeUtils.ts / DraftAuraTriggerCommand) instead of recomputing the formula here,
   *  so this always matches the toolbar badge (draft-toolbar.component.html). */
  luckyFindPercent(): number {
    return Math.round(this.characterDetailsService.talentPlayerLuckyFindChance() * 100);
  }

  /** Every level's stat gain, mirroring DraftRoom.ts levelUp: a flat +10 max HP baseline plus a
   *  class-specific bonus (Season 18). */
  levelStatBonus(): { maxHp: number; strength: number; attackSpeed: number; dodgeRate: number; income: number } {
    const bonus = { maxHp: 10, strength: 0, attackSpeed: 0, dodgeRate: 0, income: 0 };
    switch (this.playerAvatarUrl()) {
      case 'assets/warrior_01.png':
        bonus.maxHp += 20;
        bonus.strength += 4;
        break;
      case 'assets/thief_01.png':
        bonus.attackSpeed += 10;
        bonus.dodgeRate += 10;
        break;
      case 'assets/merchant_01.png':
        bonus.income += 2;
        break;
    }
    return bonus;
  }

  onMouseEnterTalent(talent: Talent) {
    talent.showDetails = true;
  }

  onMouseLeaveTalent(talent: Talent) {
    talent.showDetails = false;
  }

  selectTalent(talentId: number) {
    this.draftService.sendMessage('select_talent', { talentId });
    this.dialogRef.close();
  }

  close() {
    this.dialogRef.close();
  }

  /** Rerolls a single offered talent slot — free, once per slot. Stops propagation so it
   *  doesn't also trigger the row's own (click)="selectTalent(...)". */
  rerollSlot(talentId: number, event: MouseEvent) {
    event.stopPropagation();
    this.soundsService.playSound(SoundOptions.CLICK);
    this.draftService.sendMessage('refresh_talent_slot', { talentId });
  }
}
