import { Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild, computed, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Player } from '../../../models/colyseus-schema/PlayerSchema';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { TalentsComponent } from '../../../draft/components/talents/talents.component';
import { Talent } from '../../../models/colyseus-schema/TalentSchema';
import { InventoryComponent } from '../../../draft/components/inventory/inventory.component';
import { MatTooltip, MatTooltipModule } from '@angular/material/tooltip';
import { NgClass } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { DraftService } from '../../../draft/services/draft.service';
import { CharacterDetailsComponent } from '../character-details/character-details.component';
import { MatCardModule } from '@angular/material/card';
import { MatBadgeModule } from '@angular/material/badge';
import { SoundOptions, SoundsService } from '../../services/sounds.service';
import { CharacterDetailsService } from '../../services/character-details.service';
import { InfoBoxService } from '../../services/info-box.service';
import { InfoHintDirective } from '../../directives/info-hint.directive';
import { InfoContent } from '../../models/info-content';

@Component({
  selector: 'app-draft-toolbar',
  standalone: true,
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
    NgClass,
    MatMenuModule,
    MatCardModule,
    CharacterDetailsComponent,
    MatBadgeModule,
    InfoHintDirective,
    TalentsComponent,
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
  showTalentPicker = this.characterDetailsService.showTalentPicker;
  showCharacterDetails = computed(() => this.characterDetailsService.showCharacterDetails());

  readonly goldHint: InfoContent = {
    title: 'Gold & Income',
    entries: [
      { icon: '🟡', label: 'Gold', text: 'Your current gold. Spend it to buy and upgrade items in the shop.' },
      { icon: '💰', label: 'Income', text: 'You earn bonus gold at the end of each fight based on your income stat.' },
    ],
  };

  readonly buyXpHint: InfoContent = {
    title: 'Buy XP',
    entries: [
      { icon: '⬆️', label: 'Buy XP', text: 'Spend 4 gold to gain 4 XP. Leveling up gives you more item slots and unlocks new talents.' },
    ],
  };

  get refreshShopHint(): InfoContent {
    return {
      title: 'Refresh Shop',
      entries: [
        { icon: '🔄', label: 'Refresh', text: `Spend ${this.player.refreshShopCost} gold to roll a new set of items in the shop.` },
      ],
    };
  }

  readonly lockShopHint: InfoContent = {
    title: 'Lock Shop',
    entries: [
      { icon: '🔒', label: 'Lock', text: 'Lock your current shop items so they persist into the next round — useful when you cannot afford something right now.' },
    ],
  };

  readonly talentHint: InfoContent = {
    title: 'New Talent Available!',
    entries: [
      { icon: '🌟', label: 'Talent', text: 'You have unlocked a new talent! Click to choose a permanent passive ability that enhances your build.' },
    ],
  };

  readonly draftReadyHint: InfoContent = {
    title: 'Ready to Fight?',
    entries: [
      { icon: '⚔️', label: 'Start Battle', text: 'When you\'re happy with your build, click the Fight button at the bottom to start the round.' },
    ],
  };

  readonly fightingHint: InfoContent = {
    title: 'Battle in Progress',
    entries: [
      { icon: '⏳', label: 'Please Wait', text: 'The fight is underway — sit back and watch! The next draft round will begin when it\'s over.' },
    ],
  };

  constructor(
    public draftService: DraftService,
    private soundsService: SoundsService,
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

  switchCharacterDetails(): void {
    this.showTalentPicker.set(false);
    this.characterDetailsService.toggleCharacterDetails();
  }

  openInventory(): void {
    this.characterDetailsService.showCharacterDetails.set(false);
    this.dialog.open(InventoryComponent, {
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
    this.characterDetailsService.showCharacterDetails.set(false);
    this.soundsService.setVolume(this.muted ? 0.1 : 0);
    this.muted = !this.muted;
  }

  buyXp() {
    this.characterDetailsService.showCharacterDetails.set(false);
    this.soundsService.playSound(SoundOptions.CLICK);
    this.draftService.sendMessage('buy_xp', {});
  }

  refreshShop() {
    this.characterDetailsService.showCharacterDetails.set(false);
    this.soundsService.playSound(SoundOptions.CLICK);
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
}
