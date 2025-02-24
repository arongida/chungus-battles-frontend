import { AfterViewChecked, Component, Input, OnInit, ViewChild, computed, inject } from '@angular/core';
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
export class DraftToolbarComponent implements AfterViewChecked, OnInit {
  dialog = inject(MatDialog);
  hoverShopRefresh = false;
  hoverBuyXp = false;
  muted = false;
  showCharacterDetails = computed(() => this.characterDetailsService.showCharacterDetails());

  private previousValue: number = 0;
  private talentDialogRef: MatDialogRef<TalentsComponent> | null = null;

  constructor(
    public draftService: DraftService,
    private soundsService: SoundsService,
    private characterDetailsService: CharacterDetailsService
  ) {}

  @Input({ required: true }) player: Player = new Player();
  @Input({ required: false })
  availableTalents?: Talent[] = [];

  @ViewChild('talentPickerTooltip')
  talentPickerTooltip!: MatTooltip;

  ngOnInit(): void {
    this.muted = this.soundsService.volume === 0;
  }

  ngAfterViewChecked() {
    const currentValue = this.availableTalents?.length;

    const talentDialogisOpen = this.talentDialogRef ? this.talentDialogRef.getState() : null;

    if (
      this.previousValue === 0 &&
      currentValue === 2 &&
      !this.talentPickerTooltip._isTooltipVisible() &&
      !talentDialogisOpen
    ) {
      this.talentPickerTooltip.show();
    }
    this.previousValue = currentValue ?? 0;
  }

  openTalentPickerDialog(): void {
    this.soundsService.playSound(SoundOptions.CLICK);
    this.talentDialogRef = this.dialog.open(TalentsComponent, {
      data: {
        talents: this.availableTalents,
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
}
