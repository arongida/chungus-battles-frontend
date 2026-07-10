import { Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { DraftService } from '../../services/draft.service';
import { FightService } from '../../../fight/services/fight.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Talent } from '../../../models/colyseus-schema/TalentSchema';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Player } from '../../../models/colyseus-schema/PlayerSchema';
import { NextEnemyBadgeComponent } from '../next-enemy-badge/next-enemy-badge.component';
@Component({
  selector: 'app-ready-button',
  standalone: true,
  imports: [MatButtonModule, MatProgressSpinnerModule, MatTooltipModule, NextEnemyBadgeComponent],
  templateUrl: './ready-button.component.html',
  styleUrl: './ready-button.component.scss',
})
export class ReadyButtonComponent {
  loading = false;
  missingEquipment = false;

  constructor(
    private draftService: DraftService,
    private fightService: FightService,
  ) {}

  @Input({ required: false })
  availableTalents: Talent[] = [];
  @Input({ required: true })
  player: Player = new Player();
  /** Next-Enemy Preview pass-throughs (see DraftState.nextEnemy / next-enemy-badge). */
  @Input({ required: false })
  nextEnemy: Player = new Player();
  @Input({ required: false })
  nextEnemyRevealLevel = -1;
  @Input({ required: false })
  nextEnemyTalentClasses: string[] = [];
  @Input({ required: false })
  nextEnemyItemClasses: string[] = [];

  async startFight() {
    if (this.loading) return;
    this.loading = true;
    const playerId = localStorage.getItem('playerId');
    if (!playerId) return;
    await this.draftService.leave(false);
    await this.fightService.joinOrCreate(parseInt(playerId));
    this.loading = false;
  }

  shouldShowEquipmentWarning(): boolean {
    this.missingEquipment = false;
    const inventoryItemTypesSet = new Set(this.player.inventory.map((item) => item.type));
    let showWarning = false;
    inventoryItemTypesSet.forEach((type) => {
      // if (!this.player.equippedItems.find((item) => item.type === type)) {
      //   showWarning = true;
      //   this.missingEquipment = true;
      // }
    });
    return showWarning;
  }
}
