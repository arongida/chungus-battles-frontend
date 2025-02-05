import { AfterViewChecked, Component, Input, OnInit, ViewChild, computed, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Player } from '../../../models/colyseus-schema/PlayerSchema';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { TalentsComponent } from '../../../draft/components/talents/talents.component';
import { Talent } from '../../../models/colyseus-schema/TalentSchema';
import { CharacterDetailsDialogComponent } from '../character-details-dialog/character-details-dialog.component';
import { InventoryComponent } from '../../../draft/components/inventory/inventory.component';
import { MatTooltip, MatTooltipModule } from '@angular/material/tooltip';
import { NgClass } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipSelectionChange, MatChipsModule } from '@angular/material/chips';
import { ItemTrackingService } from '../../services/item-tracking.service';
import { DraftService } from '../../../draft/services/draft.service';
import { CharacterDetailsComponent } from '../character-details/character-details.component';
import { MatCardModule } from '@angular/material/card';
import { MatBadgeModule } from '@angular/material/badge';
import { SoundOptions, SoundsService } from '../../services/sounds.service';
import { Item } from '../../../models/colyseus-schema/ItemSchema';
import { ItemCollection } from '../../../models/colyseus-schema/ItemCollectionSchema';

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
    MatChipsModule,
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

  private previousValue: number = 0;
  private talentDialogRef: MatDialogRef<TalentsComponent, any> | null = null;
  selectedCollections = computed(() => this.itemTrackingService.trackedCollectionIds());

  constructor(
    public itemTrackingService: ItemTrackingService,
    public draftService: DraftService,
    private soundsService: SoundsService
  ) {}

  @Input({ required: true }) player: Player = new Player();
  @Input({ required: false })
  availableTalents?: Talent[] = [];
  showCharacterDetails = false;

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
      maxWidth: '100vw',
      maxHeight: '100vh',
      height: '80%',
      width: '100%',
    });
  }

  switchCharacterDetails(): void {
    this.showCharacterDetails = !this.showCharacterDetails;
    console.log('switch: ' + this.showCharacterDetails);
  }

  openInventory(): void {
    const inventoryDialog = this.dialog.open(InventoryComponent, {
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

  onSelectionChange(event: any, collectionId: number) {
    event.preventDefault();
    event.stopPropagation();
    this.itemTrackingService.toggleCollectionTracking(collectionId);
  }

  handleSelectionChange(event: MatChipSelectionChange, collectionId: number) {
    if (event.isUserInput) {
      this.itemTrackingService.toggleCollectionTracking(collectionId);
    }
  }

  getProgress(collection: ItemCollection) {
    return (
      (this.player?.getItemcollectionItemCountFromInventory(collection.itemCollectionId) /
        (collection.name.includes('Shield') ? 1 : 3)) *
      100
    );
  }

  isFighting(): boolean {
    return !this.draftService.room;
  }

  switchMute() {
    this.soundsService.setVolume(this.muted ? 0.1 : 0);
    this.muted = !this.muted;
  }

  buyXp() {
    this.soundsService.playSound(SoundOptions.CLICK);
    this.draftService.sendMessage('buy_xp', {});
  }

  refreshShop() {
    this.soundsService.playSound(SoundOptions.CLICK);
    this.draftService.sendMessage('refresh_shop', {});
  }
}
