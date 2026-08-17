import { Injectable, signal } from '@angular/core';
import { Talent } from '../../models/colyseus-schema/TalentSchema';
import { JokerCard } from '../utils/joker-cards';

@Injectable({
  providedIn: 'root',
})
export class CharacterDetailsService {
  public showTalentPicker = signal<boolean>(false);

  /** Backing data for the Joker card-pick dialog (JokerPickComponent), mirrored here by
   *  DraftToolbarComponent the same way availableTalents is below. Non-empty only while the
   *  player has an unresolved Joker pick — see joker-cards.ts. */
  public jokerCards = signal<JokerCard[]>([]);
  /** Open/closed state of the Joker card-pick dialog — a separate boolean from jokerCards
   *  (same split as showTalentPicker/availableTalents below) so re-deriving jokerCards on every
   *  state tick doesn't reopen a dialog the player deliberately dismissed; only the genuine
   *  0-cards -> 2-cards transition (detected in DraftToolbarComponent.ngOnChanges) opens it. */
  public showJokerPicker = signal<boolean>(false);

  /** Backing data for the talent-picker dialog (TalentsComponent), mirrored here by
   *  DraftToolbarComponent so the dialog — which has no @Input path once opened via
   *  MatDialog — can read the current options/level reactively, including live updates
   *  when the player rerolls while the dialog is open. */
  public availableTalents = signal<Talent[]>([]);
  // Per-slot reroll-used tracker, aligned by index with availableTalents.
  public talentRerollUsed = signal<boolean[]>([]);
  public talentPlayerLevel = signal<number>(1);
  public talentPlayerAvatarUrl = signal<string>('');
  /** Player's current cooldownReduction rating — lets the talent-picker dialog show an ACTIVE
   *  talent's real (CDR-shortened) activation cadence instead of just its base rate. */
  public talentPlayerCooldownReduction = signal<number>(0);

  /** True when the player has picked Black Market Contact — doubles the displayed lucky-find %. */
  public hasBlackMarketTalent = signal<boolean>(false);
  /** Mirrors the authoritative Player.luckyFindChance (base + level scaling + the permanent
   *  Lucky Find Mythic-buy bonus + any talent/item multipliers already applied server-side) so
   *  the talent-picker dialog's displayed % always matches the toolbar badge instead of
   *  recomputing (and drifting from) the formula on the frontend. */
  public talentPlayerLuckyFindChance = signal<number>(0);

  /** True when an item has been bought since the panel was last opened — drives the
   * "open me" glow on the minimized character panel in the shop. */
  public hasUnseenPurchase = signal<boolean>(false);

  notifyPurchase(): void {
    this.hasUnseenPurchase.set(true);
  }

  acknowledgePurchase(): void {
    this.hasUnseenPurchase.set(false);
  }
}
