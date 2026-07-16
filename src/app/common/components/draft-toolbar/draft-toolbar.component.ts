import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, effect, inject, signal } from '@angular/core';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import Item from '../../../models/colyseus-schema/ItemSchema';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Player } from '../../../models/colyseus-schema/PlayerSchema';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ConfirmDialogComponent, ConfirmDialogData } from '../confirm-dialog/confirm-dialog.component';
import { TalentsComponent } from '../../../draft/components/talents/talents.component';
import { Talent } from '../../../models/colyseus-schema/TalentSchema';
import { EncyclopediaComponent } from '../../../draft/components/encyclopedia/encyclopedia.component';
import { DecimalPipe, NgClass } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { DraftService } from '../../../draft/services/draft.service';
import { CharacterDetailsComponent } from '../character-details/character-details.component';
import { MatCardModule } from '@angular/material/card';
import { MatBadgeModule } from '@angular/material/badge';
import { SoundOptions, SoundsService } from '../../services/sounds.service';
import { CharacterDetailsService } from '../../services/character-details.service';
import { InfoBoxService } from '../../services/info-box.service';
import { InfoHintDirective } from '../../directives/info-hint.directive';
import { DraggablePanelDirective } from '../../directives/draggable-panel.directive';
import { InfoContent } from '../../models/info-content';
import { Router } from '@angular/router';
import { FightService } from '../../../fight/services/fight.service';
import { goldHint, buyXpHint, lockShopHint, talentHint, draftReadyHint, shopPhaseHint, fightingHint, abandonHint, forfeitHint, infoBoxHint, encyclopediaHint, volumeHint, matchHistoryHint } from './draft-toolbar.hints';
import { ReplaysDialogComponent } from '../replays-dialog/replays-dialog.component';
import { environment } from '../../../../environments/environment';
import { NextFightPickerComponent } from '../next-fight-picker/next-fight-picker.component';

@Component({
  selector: 'app-draft-toolbar',
  standalone: true,
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    NgClass,
    DecimalPipe,
    MatMenuModule,
    MatCardModule,
    CharacterDetailsComponent,
    MatBadgeModule,
    InfoHintDirective,
    DraggablePanelDirective,
    NextFightPickerComponent,
    DragDropModule,
  ],
  templateUrl: './draft-toolbar.component.html',
  styleUrl: './draft-toolbar.component.scss',
})
export class DraftToolbarComponent implements OnChanges, OnInit, OnDestroy {
  dialog = inject(MatDialog);
  infoBoxService = inject(InfoBoxService);
  private characterDetailsService = inject(CharacterDetailsService);
  readonly enemyPickerEnabled = environment.enemyPicker;
  hoverShopRefresh = false;
  hoverBuyXp = false;

  get volumeIcon(): string {
    return this.soundsService.volumeIcon;
  }

  showTalentPicker = this.characterDetailsService.showTalentPicker;
  /** True once a level-up has happened that the player hasn't reviewed in the talent/level modal yet. */
  levelUpPending = signal(false);
  private talentDialogRef?: MatDialogRef<TalentsComponent>;

  /** Last level we've confirmed as real (settled), used instead of Angular's own
   *  SimpleChanges.previousValue — see scheduleLevelCheck for why. Null until first seen. */
  private lastConfirmedLevel: number | null = null;
  private levelCheckTimeoutId: ReturnType<typeof setTimeout> | null = null;

  readonly goldHint = goldHint;
  readonly buyXpHint = buyXpHint;
  readonly lockShopHint = lockShopHint;
  readonly talentHint = talentHint;
  readonly draftReadyHint = draftReadyHint;
  readonly shopPhaseHint = shopPhaseHint;
  readonly fightingHint = fightingHint;
  readonly abandonHint = abandonHint;
  readonly forfeitHint = forfeitHint;
  readonly encyclopediaHint = encyclopediaHint;
  readonly matchHistoryHint = matchHistoryHint;
  readonly infoBoxHint = infoBoxHint;

  readonly volumeHint = volumeHint;

  get refreshShopHint(): InfoContent {
    return {
      id: 'refresh-shop',
      title: 'Refresh Shop',
      entries: [
        { icon: '🔄', label: 'Refresh', text: `Spend ${this.player.refreshShopCost} gold to roll a new set of items in the shop.` },
      ],
    };
  }

  get goldToLevelUp(): number {
    const xpNeeded = this.player.maxXp - this.player.xp;
    return Math.ceil(xpNeeded / 4) * 4;
  }

  get canLevelUp(): boolean {
    return this.player.gold >= this.goldToLevelUp;
  }

  /** Per-level stat bonus for the player's class, mirroring DraftRoom.ts levelUp:
   *  +10 max HP baseline for everyone, plus a class-specific bonus (Season 18). */
  get classLevelBonusText(): string {
    switch (this.player.avatarUrl) {
      case 'assets/warrior_01.png':
        return '+40 HP, +6 strength';
      case 'assets/thief_01.png':
        return '+10 HP, +20% attack speed, +10 dodge';
      case 'assets/merchant_01.png':
        return '+10 HP, +2 income';
      default:
        return '+10 HP';
    }
  }

  get levelUpHint(): InfoContent {
    return {
      id: 'level-up',
      title: 'Level Up!',
      entries: [
        { icon: '⬆️', label: 'Level Up', text: `Spend ${this.goldToLevelUp} gold to level up to level ${this.player.level + 1} in one click.` },
        { icon: '📈', label: 'This Level', text: `Level ${this.player.level + 1} grants: ${this.classLevelBonusText}` },
      ],
    };
  }

  get xpButtonHint(): InfoContent {
    return this.canLevelUp ? this.levelUpHint : this.buyXpHint;
  }

  constructor(
    public draftService: DraftService,
    private fightService: FightService,
    private soundsService: SoundsService,
    private router: Router,
  ) {
    // Mirrors showTalentPicker to an actual MatDialogRef so the talent picker renders in the
    // CDK overlay instead of the inline @if block it used to be — see TalentsComponent and
    // ConfirmDialogComponent's class doc for why (toolbar host stacking-context cap).
    effect(() => {
      const show = this.showTalentPicker();
      if (show && !this.talentDialogRef) {
        this.talentDialogRef = this.dialog.open(TalentsComponent, {
          backdropClass: 'chungus-dialog-backdrop',
          autoFocus: false,
        });
        this.talentDialogRef.afterClosed().subscribe(() => {
          this.talentDialogRef = undefined;
          this.closeTalentPicker();
        });
      } else if (!show && this.talentDialogRef) {
        this.talentDialogRef.close();
      }
    });
  }

  @Input({ required: true }) player: Player = new Player();
  @Input({ required: false }) availableTalents?: Talent[] = [];
  isLocked : Boolean = false;


  ngOnInit(): void {
    this.infoBoxService.setPageDefault(this.isFighting() ? this.fightingHint : this.shopPhaseHint);
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Keep the talent dialog's data current on every change — not just open/close
    // transitions — so it reflects live updates (e.g. a reroll) while it's already open.
    // TalentsComponent reads these instead of @Inputs since MatDialog content has no
    // input binding path back to this template.
    this.characterDetailsService.availableTalents.set(this.availableTalents ?? []);
    this.characterDetailsService.talentPlayerLevel.set(this.player.level);
    this.characterDetailsService.talentPlayerAvatarUrl.set(this.player.avatarUrl);
    // talentId 504 = Black Market Contact (doubles the displayed lucky-find %).
    this.characterDetailsService.hasBlackMarketTalent.set(
      this.player.talents?.some((t) => t.talentId === 504) ?? false
    );

    const talentsChange = changes['availableTalents'];
    if (talentsChange) {
      const prevLen = talentsChange.previousValue?.length ?? 0;
      const curLen = talentsChange.currentValue?.length ?? 0;
      if (prevLen === 0 && curLen > 0) {
        this.showTalentPicker.set(true);
        this.infoBoxService.setPageDefault(this.talentHint);
      }
      // Only close on the talent-was-picked transition — staying empty (e.g. level 6+,
      // no talent to grant) must not slam the merged level modal shut.
      if (prevLen > 0 && curLen === 0) {
        this.showTalentPicker.set(false);
        this.levelUpPending.set(false);
        this.infoBoxService.setPageDefault(this.shopPhaseHint);
      }
    }

    if (changes['player']) {
      this.scheduleLevelCheck(changes['player'].currentValue?.level);
    }
  }

  /**
   * Detects real level-ups without trusting Angular's SimpleChanges.previousValue: on a
   * laggy connection, room.onStateChange can fire with a transient/partially-hydrated
   * Player snapshot (e.g. while reconnecting or just after joining the shop phase), and
   * comparing against whatever object happened to arrive last produced false positives —
   * the modal popped up even though the player's level never actually changed. Instead we
   * track our own last-confirmed level and debounce: a candidate increase only fires once
   * it's still true after a short settle window, so a one-tick glitch can't trigger it.
   */
  private scheduleLevelCheck(observedLevel: number | undefined): void {
    if (typeof observedLevel !== 'number' || observedLevel < 1) return;

    if (this.lastConfirmedLevel === null) {
      this.lastConfirmedLevel = observedLevel;
      return;
    }

    if (observedLevel <= this.lastConfirmedLevel) return;

    if (this.levelCheckTimeoutId) clearTimeout(this.levelCheckTimeoutId);
    this.levelCheckTimeoutId = setTimeout(() => {
      this.levelCheckTimeoutId = null;
      const settledLevel = this.player.level;
      if (settledLevel > (this.lastConfirmedLevel ?? 0)) {
        this.lastConfirmedLevel = settledLevel;
        this.levelUpPending.set(true);
        this.showTalentPicker.set(true);
      }
    }, 400);
  }

  ngOnDestroy(): void {
    if (this.levelCheckTimeoutId) clearTimeout(this.levelCheckTimeoutId);
  }

  shopItemOverPanel = false;

  onShopItemDrop(event: CdkDragDrop<unknown>): void {
    const item = event.item.data as Item;
    if (!item || item.sold) return;
    this.draftService.sendMessage('buy', { itemId: item.itemId });
    this.soundsService.playSound(SoundOptions.BUY);
    this.characterDetailsService.showTalentPicker.set(false);
    this.characterDetailsService.notifyPurchase();
  }

  toggleTalentPicker(): void {
    this.soundsService.playSound(SoundOptions.CLICK);
    const opening = !this.showTalentPicker();
    this.showTalentPicker.set(opening);
    if (!opening) this.levelUpPending.set(false);
  }

  closeTalentPicker(): void {
    this.showTalentPicker.set(false);
    this.levelUpPending.set(false);
  }

  openEncyclopedia(): void {
    this.infoBoxService.runGated(this.encyclopediaHint, () => {
      this.dialog.open(EncyclopediaComponent, {
        data: {
          player: this.player,
        },
        maxWidth: '100vw',
        maxHeight: '100vh',
        height: '100%',
        width: '80%',
      });
    });
  }

  /** On touch, hints stay enabled at all times (see toggleInfoBox), so the highlight would
   *  always be on and falsely imply an active hover-hint mode that doesn't exist there. */
  infoBoxHighlighted(): boolean {
    return !this.infoBoxService.isTouch && this.infoBoxService.isVisible();
  }

  toggleInfoBox(): void {
    // Touch devices keep hints always on (no hover-driven panel to toggle), so the
    // button instead offers a way to bring back hints already seen/dismissed.
    if (this.infoBoxService.isTouch) {
      this.openConfirmDialog({
        icon: '🔄',
        title: 'Reset Tutorial Hints?',
        body: "This brings back every tutorial hint you've already seen or dismissed, so they'll pop up again as you play.",
        cancelLabel: 'Cancel',
        confirmLabel: 'Reset',
      }, () => this.infoBoxService.resetTutorial());
      return;
    }
    // Only confirm when turning hints OFF — re-enabling them is always safe.
    if (this.infoBoxService.isVisible()) {
      this.openConfirmDialog({
        icon: '❓',
        title: 'Disable Hints?',
        body: 'Tutorial hints explain what each button does. You can turn them back on anytime from this same button.',
        cancelLabel: 'Keep Hints On',
        confirmLabel: 'Disable',
      }, () => this.infoBoxService.toggle());
      return;
    }
    this.infoBoxService.toggle();
  }

  switchShopRefreshAnimate() {
    this.hoverShopRefresh = !this.hoverShopRefresh;
  }

  switchBuyXpAnimate() {
    this.hoverBuyXp = !this.hoverBuyXp;
  }

  isFighting(): boolean {
    return !this.draftService.room();
  }

  cycleVolume() {
    this.infoBoxService.runGated(this.volumeHint, () => this.soundsService.cycleVolume());
  }

  buyXp() {
    this.infoBoxService.runGated(this.buyXpHint, () => {
      this.soundsService.playSound(SoundOptions.CLICK);
      this.draftService.sendMessage('buy_xp', {});
    });
  }

  levelUp() {
    this.infoBoxService.runGated(this.levelUpHint, () => {
      this.soundsService.playSound(SoundOptions.CLICK);
      this.draftService.sendMessage('level_up', {});
    });
  }

  refreshShop() {
    this.infoBoxService.runGated(this.refreshShopHint, () => {
      this.soundsService.playSound(SoundOptions.CLICK);
      this.isLocked = false;
      this.draftService.sendMessage('refresh_shop', {});
    });
  }

  lockShop() {
    this.infoBoxService.runGated(this.lockShopHint, () => {
      this.soundsService.playSound(SoundOptions.CLICK);
      this.isLocked = !this.isLocked;
      if (this.isLocked) {
        this.draftService.sendMessage('lock-shop', {});
      } else {
        this.draftService.sendMessage('unlock-shop', {});
      }
    });
  }

  openReplays(): void {
    this.dialog.open(ReplaysDialogComponent, {
      data: { originalPlayerId: this.player.originalPlayerId },
      backdropClass: 'chungus-dialog-backdrop',
      autoFocus: false,
    });
  }

  confirmAbandon(): void {
    this.openConfirmDialog({
      icon: '🏳️',
      title: 'Abandon Run?',
      body: "Are you sure you want to abandon your run? You won't be able to continue it after that.",
      cancelLabel: 'Keep Playing',
      confirmLabel: 'Abandon',
      confirmDanger: true,
    }, () => this.doAbandon());
  }

  confirmForfeit(): void {
    this.openConfirmDialog({
      icon: '🚩',
      title: 'Forfeit This Fight?',
      body: "This counts as a loss — you'll lose a life and get the usual consolation gold, but your run continues.",
      cancelLabel: 'Keep Fighting',
      confirmLabel: 'Forfeit',
      confirmDanger: true,
    }, () => this.doForfeit());
  }

  /** Opens the shared confirm dialog via MatDialog (CDK overlay, z-index 800) so it's never
   *  capped by the toolbar host's own stacking context — see ConfirmDialogComponent. */
  private openConfirmDialog(data: ConfirmDialogData, onConfirm: () => void): void {
    this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
        data,
        backdropClass: 'chungus-dialog-backdrop',
        autoFocus: false,
      })
      .afterClosed()
      .subscribe(ok => { if (ok) onConfirm(); });
  }

  /** Concedes only the current fight (counts as a normal loss) — the draft/run continues
   *  via the usual end_battle flow, so no navigation is needed here. */
  private doForfeit(): void {
    this.fightService.room()?.send('forfeit_fight', {});
  }

  private doAbandon(): void {
    const fightRoom = this.fightService.room();
    const draftRoom = this.draftService.room();
    if (fightRoom) fightRoom.send('abandon_run', {});
    else if (draftRoom) draftRoom.send('abandon_run', {});
    this.soundsService.stopMusic();
    localStorage.removeItem('reconnectToken');
    localStorage.removeItem('battleEndState');
    // Navigate first so reactive room-signal effects in DraftRoomComponent don't
    // fire while the toolbar is still mounted, which can cancel navigation.
    // Leave the room after Angular has destroyed the old route's components.
    this.router.navigate(['/end', { won: 'lost' }]).then(() => {
      if (fightRoom) this.fightService.leave(false);
      else if (draftRoom) this.draftService.leave(false);
    });
  }
}
