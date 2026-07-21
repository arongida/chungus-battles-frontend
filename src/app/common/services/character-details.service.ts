import { Injectable, signal } from '@angular/core';
import { Talent } from '../../models/colyseus-schema/TalentSchema';

@Injectable({
  providedIn: 'root',
})
export class CharacterDetailsService {
  public showTalentPicker = signal<boolean>(false);

  /** Backing data for the talent-picker dialog (TalentsComponent), mirrored here by
   *  DraftToolbarComponent so the dialog — which has no @Input path once opened via
   *  MatDialog — can read the current options/level reactively, including live updates
   *  when the player rerolls while the dialog is open. */
  public availableTalents = signal<Talent[]>([]);
  // Per-slot reroll-used tracker, aligned by index with availableTalents.
  public talentRerollUsed = signal<boolean[]>([]);
  public talentPlayerLevel = signal<number>(1);
  public talentPlayerAvatarUrl = signal<string>('');

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
