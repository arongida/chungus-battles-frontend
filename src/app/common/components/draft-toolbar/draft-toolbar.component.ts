import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Player } from '../../../models/colyseus-schema/PlayerSchema';
import { MatDialog } from '@angular/material/dialog';
import { TalentsComponent } from '../../../draft/components/talents/talents.component';
import { Talent } from '../../../models/colyseus-schema/TalentSchema';
import { EncyclopediaComponent } from '../../../draft/components/encyclopedia/encyclopedia.component';
import { DatePipe, NgClass } from '@angular/common';
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
import { Router, RouterLink } from '@angular/router';
import { FightService } from '../../../fight/services/fight.service';
import { goldHint, buyXpHint, lockShopHint, talentHint, draftReadyHint, fightingHint, abandonHint, infoBoxHint, encyclopediaHint, muteHint, unmuteHint, matchHistoryHint } from './draft-toolbar.hints';
import { ReplayListItem } from '../../../replay/replay-room.component';
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
    MatMenuModule,
    MatCardModule,
    CharacterDetailsComponent,
    MatBadgeModule,
    InfoHintDirective,
    DraggablePanelDirective,
    TalentsComponent,
    RouterLink,
    DatePipe,
    NextFightPickerComponent,
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
  muted = false;
  showAbandonConfirm = signal(false);
  showResetTutorialConfirm = signal(false);
  replaysOpen = signal(false);
  replays = signal<ReplayListItem[]>([]);
  replaysLoading = signal(false);
  private replaysCache = new Map<number, ReplayListItem[]>();

  showTalentPicker = this.characterDetailsService.showTalentPicker;
  /** True once a level-up has happened that the player hasn't reviewed in the talent/level modal yet. */
  levelUpPending = signal(false);

  /** Last level we've confirmed as real (settled), used instead of Angular's own
   *  SimpleChanges.previousValue — see scheduleLevelCheck for why. Null until first seen. */
  private lastConfirmedLevel: number | null = null;
  private levelCheckTimeoutId: ReturnType<typeof setTimeout> | null = null;

  readonly goldHint = goldHint;
  readonly buyXpHint = buyXpHint;
  readonly lockShopHint = lockShopHint;
  readonly talentHint = talentHint;
  readonly draftReadyHint = draftReadyHint;
  readonly fightingHint = fightingHint;
  readonly abandonHint = abandonHint;
  readonly encyclopediaHint = encyclopediaHint;
  readonly matchHistoryHint = matchHistoryHint;
  readonly infoBoxHint = infoBoxHint;

  get soundHint() { return this.muted ? unmuteHint : muteHint; }

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

  get levelUpHint(): InfoContent {
    return {
      id: 'level-up',
      title: 'Level Up!',
      entries: [
        { icon: '⬆️', label: 'Level Up', text: `Spend ${this.goldToLevelUp} gold to level up to level ${this.player.level + 1} in one click.` },
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
  ) { }

  @Input({ required: true }) player: Player = new Player();
  @Input({ required: false }) availableTalents?: Talent[] = [];
  isLocked : Boolean = false;

  ngOnInit(): void {
    this.muted = this.soundsService.volume === 0;
    this.infoBoxService.setPageDefault(this.isFighting() ? this.fightingHint : this.draftReadyHint);
  }

  ngOnChanges(changes: SimpleChanges): void {
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
        this.infoBoxService.setPageDefault(this.draftReadyHint);
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
    if (!this.infoBoxService.gateAction(this.encyclopediaHint)) return;
    this.dialog.open(EncyclopediaComponent, {
      data: {
        player: this.player,
      },
      maxWidth: '100vw',
      maxHeight: '100vh',
      height: '100%',
      width: '80%',
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
      this.showResetTutorialConfirm.set(true);
      return;
    }
    this.infoBoxService.toggle();
  }

  cancelResetTutorial(): void {
    this.showResetTutorialConfirm.set(false);
  }

  doResetTutorial(): void {
    this.showResetTutorialConfirm.set(false);
    this.infoBoxService.resetTutorial();
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

  switchMute() {
    this.soundsService.setVolume(this.muted ? 0.1 : 0);
    this.muted = !this.muted;
  }

  buyXp() {
    if (!this.infoBoxService.gateAction(this.buyXpHint)) return;
    this.soundsService.playSound(SoundOptions.CLICK);
    this.draftService.sendMessage('buy_xp', {});
  }

  levelUp() {
    if (!this.infoBoxService.gateAction(this.levelUpHint)) return;
    this.soundsService.playSound(SoundOptions.CLICK);
    this.draftService.sendMessage('level_up', {});
  }

  refreshShop() {
    if (!this.infoBoxService.gateAction(this.refreshShopHint)) return;
    this.soundsService.playSound(SoundOptions.CLICK);
    this.isLocked = false;
    this.draftService.sendMessage('refresh_shop', {});
  }

  lockShop() {
    if (!this.infoBoxService.gateAction(this.lockShopHint)) return;
    this.isLocked = !this.isLocked;
    if(this.isLocked){
      this.draftService.sendMessage('lock-shop', {});
    }else{
      this.draftService.sendMessage('unlock-shop', {});
    }
  }

  async openReplays(): Promise<void> {
    this.replaysOpen.set(true);
    const origId = this.player.originalPlayerId;
    const cached = this.replaysCache.get(origId);
    if (cached) { this.replays.set(cached); return; }
    this.replaysLoading.set(true);
    try {
      const data = await fetch(`${environment.gameServer}/replays?originalPlayerId=${origId}`).then(r => r.json());
      const list = Array.isArray(data) ? data.reverse() : [];
      this.replaysCache.set(origId, list);
      this.replays.set(list);
    } catch {
      this.replays.set([]);
    } finally {
      this.replaysLoading.set(false);
    }
  }

  closeReplays(): void {
    this.replaysOpen.set(false);
  }

  replayResultLabel(result: string): string {
    if (result === 'win') return '⚔️ Win';
    if (result === 'lose' || result === 'loose') return '🛡️ Loss';
    return '⚡ Draw';
  }

  confirmAbandon(): void {
    this.showAbandonConfirm.set(true);
  }

  cancelAbandon(): void {
    this.showAbandonConfirm.set(false);
  }

  doAbandon(): void {
    this.showAbandonConfirm.set(false);
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
