import { Component, Input, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Player } from '../../../models/colyseus-schema/PlayerSchema';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog } from '@angular/material/dialog';
import { TalentsComponent } from '../talents/talents.component';
import { Talent } from '../../../models/colyseus-schema/TalentSchema';
import { CharacterDetailsComponent } from '../character-details/character-details.component';
import { InventoryComponent } from '../inventory/inventory.component';

@Component({
  selector: 'app-draft-toolbar',
  standalone: true,
  imports: [MatToolbarModule, MatButtonModule, MatIconModule, MatProgressBarModule],
  templateUrl: './draft-toolbar.component.html',
  styleUrl: './draft-toolbar.component.scss',
})
export class DraftToolbarComponent {
  dialog = inject(MatDialog);
 
  @Input({ required: true }) player: Player = new Player();
  @Input({ required: true }) availableTalents: Talent[] = [];

  
  openTalentPickerDialog(): void {
    const talentDialogRef = this.dialog.open(TalentsComponent, {
      data: {
        talents: this.availableTalents,
        playerLevel: this.player?.level ?? 1,
      },
    });
  }

  openCharacterDetails(): void {
    const charDetailsDialog = this.dialog.open(CharacterDetailsComponent, {
      data: {
        player: this.player
      },
    });
  }

  openInventory(): void {
    const inventoryDialog = this.dialog.open(InventoryComponent, {
      data: {
        player: this.player
      },
      maxWidth: '100vw',
      maxHeight: '100vh',
      height: '100%',
      width: '80%'
    });
    
  }
}
