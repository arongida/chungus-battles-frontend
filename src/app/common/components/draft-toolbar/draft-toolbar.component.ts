import { Component, Input, OnChanges, OnInit, SimpleChanges, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Player } from '../../../models/colyseus-schema/PlayerSchema';
import { MatProgressBarModule } from '@angular/material/progress-bar';
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
import { goldHint, buyXpHint, xpBarHint, lockShopHint, talentHint, draftReadyHint, fightingHint, abandonHint, infoBoxHint, encyclopediaHint, muteHint, unmuteHint, matchHistoryHint } from './draft-toolbar.hints';
import { ReplayListItem } from '../../../replay/replay-room.component';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-draft-toolbar',
  standalone: true,
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
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
  ],
  templateUrl: './draft-toolbar.component.html',
  styleUrl: './draft-toolbar.component.scss',
})
export class DraftToolbarComponent implements OnChanges, OnInit {
  dialog = inject(MatDialog);
  infoBoxService = inject(InfoBoxService);
  private characterDetailsService = inject(CharacterDetailsService);
  hoverShopRefresh = false;
  hoverBuyXp = false;
  muted = false;
  showAbandonConfirm = signal(false);
  replaysOpen = signal(false);
  replays = signal<ReplayListItem[]>([]);
  replaysLoading = signal(false);
  private replaysCache = new Map<number, ReplayListItem[]>();

  showTalentPicker = this.characterDetailsService.showTalentPicker;

  readonly goldHint = goldHint;
  readonly buyXpHint = buyXpHint;
  readonly xpBarHint = xpBarHint;
  readonly lockShopHint = lockShopHint;
  readonly talentHint = talentHint;
  readonly draftReadyHint = draftReadyHint;
  readonly fightingHint = fightingHint;
  readonly abandonHint = abandonHint;
  readonly infoBoxHint = infoBoxHint;
  readonly encyclopediaHint = encyclopediaHint;
  readonly matchHistoryHint = matchHistoryHint;

  get soundHint() { return this.muted ? unmuteHint : muteHint; }

  get refreshShopHint(): InfoContent {
    return {
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
    const change = changes['availableTalents'];
    if (!change) return;
    if ((change.previousValue?.length ?? 0) === 0 && change.currentValue?.length > 0) {
      this.showTalentPicker.set(true);
      this.infoBoxService.setPageDefault(this.talentHint);
    }
    if ((change.currentValue?.length ?? 0) === 0) {
      this.showTalentPicker.set(false);
      this.infoBoxService.setPageDefault(this.draftReadyHint);
    }
  }

  toggleTalentPicker(): void {
    this.soundsService.playSound(SoundOptions.CLICK);
    this.showTalentPicker.update(v => !v);
  }

  closeTalentPicker(): void {
    this.showTalentPicker.set(false);
  }

  openEncyclopedia(): void {
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

  toggleInfoBox(): void {
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

  switchMute() {
    this.soundsService.setVolume(this.muted ? 0.1 : 0);
    this.muted = !this.muted;
  }

  buyXp() {
    this.soundsService.playSound(SoundOptions.CLICK);
    this.draftService.sendMessage('buy_xp', {});
  }

  levelUp() {
    this.soundsService.playSound(SoundOptions.CLICK);
    this.draftService.sendMessage('level_up', {});
  }

  refreshShop() {
    this.soundsService.playSound(SoundOptions.CLICK);
    this.isLocked = false;
    this.draftService.sendMessage('refresh_shop', {});
  }

  lockShop() {
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
