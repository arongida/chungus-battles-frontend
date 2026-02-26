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
import {
  TutorialComponent
} from '../../../draft/components/tutorial/tutorial.component';

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
  ],
  templateUrl: './draft-toolbar.component.html',
  styleUrl: './draft-toolbar.component.scss',
})
export class DraftToolbarComponent implements OnChanges, OnInit {
  dialog = inject(MatDialog);
  hoverShopRefresh = false;
  hoverBuyXp = false;
  muted = false;
  showCharacterDetails = computed(() => this.characterDetailsService.showCharacterDetails());

  private talentDialogRef: MatDialogRef<TalentsComponent> | null = null;

  constructor(
    public draftService: DraftService,
    private soundsService: SoundsService,
    private characterDetailsService: CharacterDetailsService
  ) { }

  @Input({ required: true }) player: Player = new Player();
  @Input({ required: false }) availableTalents?: Talent[] = [];
  isLocked : Boolean = false;

  @ViewChild('talentPickerTooltip')
  talentPickerTooltip!: MatTooltip;

  ngOnInit(): void {
    this.muted = this.soundsService.volume === 0;
  }

  ngOnChanges(changes: SimpleChanges): void {
    const change = changes['availableTalents'];
    if (!change) return;

    // Show tooltip when talents first become available
    if (
      (change.previousValue?.length ?? 0) === 0 &&
      change.currentValue?.length === 2 &&
      this.talentPickerTooltip &&
      !this.talentPickerTooltip._isTooltipVisible() &&
      !this.talentDialogRef?.getState()
    ) {
      setTimeout(() => this.talentPickerTooltip?.show(), 0);
    }

    // Push updated talents into the dialog if it is open
    const instance = this.talentDialogRef?.componentInstance;
    if (instance && change.currentValue) {
      instance.talents.set(change.currentValue.map((t: Talent) => ({ ...t })));
    }
  }

  openTalentPickerDialog(): void {
    this.soundsService.playSound(SoundOptions.CLICK);
    this.talentDialogRef = this.dialog.open(TalentsComponent, {
      data: {
        talents: this.availableTalents?.map(t => ({ ...t })),
        playerLevel: this.player?.level ?? 1,
      },
    });
  }

  switchCharacterDetails(): void {
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

  openTutorial(): void {
    this.dialog.open(TutorialComponent, {

    })
  }

  switchShopRefreshAnimate() {
    this.hoverShopRefresh = !this.hoverShopRefresh;
  }

  switchBuyXpAnimate() {
    this.hoverBuyXp = !this.hoverBuyXp;
  }


  isFighting(): boolean {
    return !this.draftService.room;
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
