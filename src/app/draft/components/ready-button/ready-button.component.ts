import { Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { DraftService } from '../../services/draft.service';
import { FightService } from '../../../fight/services/fight.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Talent } from '../../../models/colyseus-schema/TalentSchema';
import { SoundOptions, SoundsService } from '../../../common/services/sounds.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Player } from '../../../models/colyseus-schema/PlayerSchema';
import { CharacterDetailsService } from '../../../common/services/character-details.service';
@Component({
  selector: 'app-ready-button',
  standalone: true,
  imports: [MatButtonModule, MatProgressSpinnerModule, MatTooltipModule],
  templateUrl: './ready-button.component.html',
  styleUrl: './ready-button.component.scss',
})
export class ReadyButtonComponent {
  loading = false;
  missingEquipment = false;

  constructor(
    private draftService: DraftService,
    private fightService: FightService,
    private soundsService: SoundsService,
    private characterDetailsService: CharacterDetailsService
  ) {}

  @Input({ required: false })
  availableTalents: Talent[] = [];
  @Input({ required: true })
  player: Player = new Player();

  async startFight() {
    this.soundsService.playSound(SoundOptions.CLICK);
    if (this.loading) return;
    this.loading = true;
    const playerId = localStorage.getItem('playerId');
    if (!playerId) return;
    await this.draftService.leave(false);
    await this.fightService.joinOrCreate(parseInt(playerId));
    this.loading = false;
  }

  openCharacterDetails() {
    if (this.missingEquipment) {
      this.characterDetailsService.showCharacterDetails.set(true);
    }
  }

  shouldShowEquipmentWarning(): boolean {
    this.missingEquipment = false;
    const inventoryItemTypesSet = new Set(this.player.inventory.map((item) => item.type));
    let showWarning = false;
    inventoryItemTypesSet.forEach((type) => {
      if (!this.player.equippedItems.find((item) => item.type === type)) {
        showWarning = true;
        this.missingEquipment = true;
      }
    });
    return showWarning;
  }
}
