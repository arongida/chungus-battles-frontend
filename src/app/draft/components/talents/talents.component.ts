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
import { buildActiveSkillLabel } from '../../../common/utils/active-skill-label';
import { STAT_DISPLAY } from '../../../common/utils/stat-display';

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
  playerCooldownReduction = computed(() => this.characterDetailsService.talentPlayerCooldownReduction());

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
      : 'Free reroll available — use the reroll panel on the right.';

    const statEntries = this.buildStatEntries(talent);
    const activeSkill = this.activeSkillLabel(talent);

    return {
      id: 'talent-pick',
      title: talent.name,
      entries: [
        { icon: '🌟', text: talent.description },
        { icon: '⚡', label: 'Triggers', text: activeSkill.otherTriggers.join(', ') || '—' },
        ...(activeSkill.activeText ? [{ icon: '⏳', label: 'Active', text: activeSkill.activeText, color: 'text-purple-400' }] : []),
        ...statEntries,
        { icon: '🔄', label: 'Reroll', text: rerollText },
      ],
    };
  }

  /** ACTIVE-skill cadence line, using the player's live cooldownReduction (talent-picker dialog
   *  always has player context, unlike the encyclopedia). */
  activeSkillLabel(talent: Talent) {
    return buildActiveSkillLabel(talent.triggerTypes, talent.activationRate, this.playerCooldownReduction());
  }

  private buildStatEntries(talent: Talent): { icon: string; label: string; text: string; color?: string }[] {
    const entries: { icon: string; label: string; text: string; color?: string }[] = [];
    const s = talent.affectedStats;
    const e = talent.affectedEnemyStats;

    const fmt = (v: number) => (v > 0 ? `+${v}` : `${v}`);

    if (s?.strength)         entries.push({ icon: STAT_DISPLAY.strength.icon, label: STAT_DISPLAY.strength.label, text: STAT_DISPLAY.strength.describe(s.strength), color: STAT_DISPLAY.strength.color });
    if (s?.accuracy)         entries.push({ icon: STAT_DISPLAY.accuracy.icon, label: STAT_DISPLAY.accuracy.label, text: STAT_DISPLAY.accuracy.describe(s.accuracy), color: STAT_DISPLAY.accuracy.color });
    if (s?.attackSpeed && s.attackSpeed !== 1) entries.push({ icon: STAT_DISPLAY.attackSpeed.icon, label: STAT_DISPLAY.attackSpeed.label, text: STAT_DISPLAY.attackSpeed.describe(s.attackSpeed - 1), color: STAT_DISPLAY.attackSpeed.color });
    if (s?.maxHp)            entries.push({ icon: STAT_DISPLAY.maxHp.icon, label: STAT_DISPLAY.maxHp.label, text: STAT_DISPLAY.maxHp.describe(s.maxHp), color: STAT_DISPLAY.maxHp.color });
    if (s?.defense)          entries.push({ icon: STAT_DISPLAY.defense.icon, label: STAT_DISPLAY.defense.label, text: STAT_DISPLAY.defense.describe(s.defense), color: STAT_DISPLAY.defense.color });
    if (s?.dodgeRate)        entries.push({ icon: STAT_DISPLAY.dodgeRate.icon, label: STAT_DISPLAY.dodgeRate.label, text: STAT_DISPLAY.dodgeRate.describe(s.dodgeRate), color: STAT_DISPLAY.dodgeRate.color });
    if (s?.income)           entries.push({ icon: STAT_DISPLAY.income.icon, label: STAT_DISPLAY.income.label, text: STAT_DISPLAY.income.describe(s.income), color: STAT_DISPLAY.income.color });
    if (s?.hpRegen)          entries.push({ icon: STAT_DISPLAY.hpRegen.icon, label: STAT_DISPLAY.hpRegen.label, text: STAT_DISPLAY.hpRegen.describe(s.hpRegen), color: STAT_DISPLAY.hpRegen.color });
    if (s?.cooldownReduction) entries.push({ icon: STAT_DISPLAY.cooldownReduction.icon, label: STAT_DISPLAY.cooldownReduction.label, text: STAT_DISPLAY.cooldownReduction.describe(s.cooldownReduction), color: STAT_DISPLAY.cooldownReduction.color });

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
        bonus.maxHp += 10;
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
