import {
  AfterViewChecked,
  ChangeDetectorRef,
  Component,
  Input,
  ViewChild,
  inject,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Player } from '../../../models/colyseus-schema/PlayerSchema';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import {
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { TalentsComponent } from '../talents/talents.component';
import { Talent } from '../../../models/colyseus-schema/TalentSchema';
import { CharacterDetailsComponent } from '../character-details/character-details.component';
import { InventoryComponent } from '../inventory/inventory.component';
import {
  MatTooltip,
  MatTooltipModule,
} from '@angular/material/tooltip';
import { DraftService } from '../../services/draft.service';
import { NgClass } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';

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
  ],
  templateUrl: './draft-toolbar.component.html',
  styleUrl: './draft-toolbar.component.scss',
})
export class DraftToolbarComponent
  implements AfterViewChecked
{
  dialog = inject(MatDialog);
  hoverShopRefresh = false;
  hoverBuyXp = false;

  private previousValue: number = 0;
  private talentDialogRef: MatDialogRef<
    TalentsComponent,
    any
  > | null = null;

  constructor(
    public draftService: DraftService,
    private cd: ChangeDetectorRef
  ) {}

  @Input({ required: true }) player: Player =
    new Player();
  @Input({ required: true })
  availableTalents: Talent[] = [];

  @ViewChild('talentPickerTooltip')
  talentPickerTooltip!: MatTooltip;

  ngAfterViewChecked() {
    const currentValue =
      this.availableTalents.length;

    const talentDialogisOpen = this
      .talentDialogRef
      ? this.talentDialogRef.getState()
      : null;

    if (
      this.previousValue === 0 &&
      currentValue === 2 &&
      !this.talentPickerTooltip._isTooltipVisible() &&
      !talentDialogisOpen
    ) {
      this.talentPickerTooltip.show();
    }
    this.previousValue = currentValue;

    this.cd.detectChanges();
  }

  openTalentPickerDialog(): void {
    this.talentDialogRef = this.dialog.open(
      TalentsComponent,
      {
        data: {
          talents: this.availableTalents,
          playerLevel: this.player?.level ?? 1,
        },
        maxWidth: '100vw',
        maxHeight: '100vh',
        height: '80%',
        width: '100%',
      }
    );
  }

  openCharacterDetails(): void {
    const charDetailsDialog = this.dialog.open(
      CharacterDetailsComponent,
      {
        data: {
          player: this.player,
        },
      }
    );
  }

  openInventory(): void {
    const inventoryDialog = this.dialog.open(
      InventoryComponent,
      {
        data: {
          player: this.player,
        },
        maxWidth: '100vw',
        maxHeight: '100vh',
        height: '100%',
        width: '80%',
      }
    );
  }

  switchShopRefreshAnimate() {
    this.hoverShopRefresh =
      !this.hoverShopRefresh;
  }

  switchBuyXpAnimate() {
    this.hoverBuyXp = !this.hoverBuyXp;
  }

  toggleCollection(collectionId: number) {
    if (
      this.draftService
        .trackedCollectionIds()
        .includes(collectionId)
    ) {
      this.draftService.trackedCollectionIds.set(
        this.draftService
          .trackedCollectionIds()
          .filter((id) => id !== collectionId)
      );
    } else {
      this.draftService
        .trackedCollectionIds()
        .push(collectionId);
    }

    this.draftService.saveTrackedCollectionIds();
  }

  getItemcollectionItemCount(
    collectionId: number
  ) {
    return this.player?.inventory.filter((item) =>
      item.itemCollections.includes(collectionId)
    ).length;
  }

  getItemCollectionMaxCount(
    collectionName: string
  ) {
    let maxCount = 3;
    if (
      collectionName.includes('Shields vol I.')
    ) {
      maxCount = 1;
    } else if (
      collectionName.includes('Shields vol II.')
    ) {
      maxCount = 2;
    } else if (
      collectionName.includes('Shields vol III.')
    ) {
      maxCount = 3;
    } else if (
      collectionName.includes('Shields vol IV.')
    ) {
      maxCount = 4;
    } else if (
      collectionName.includes('Shields vol V.')
    ) {
      maxCount = 5;
    }
    return maxCount;
  }
}
