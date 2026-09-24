import { Component, Inject, Signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { DraftService } from '../../services/draft.service';
import { BATTLE_CRY_SLOTS, BattleCrySlot, EMOTES, emoteIdsForSlot } from '../../../common/social/emote-catalog';

export type BattleCries = Record<BattleCrySlot, string>;

export interface BattleCriesDialogData {
  /** Live picks from the synced Player state (draft toolbar keeps it current). */
  cries: Signal<BattleCries>;
}

/** Pick the preset lines your character — and every ghost it leaves behind — says in fights.
 *  Selection is server-authoritative: a click sends 'set_battle_cry' and the highlight follows
 *  the synced Player field, never a local guess. */
@Component({
  selector: 'app-battle-cries-dialog',
  standalone: true,
  imports: [MatDialogModule],
  templateUrl: './battle-cries-dialog.component.html',
  styleUrl: './battle-cries-dialog.component.scss',
})
export class BattleCriesDialogComponent {
  readonly slots = BATTLE_CRY_SLOTS.map(s => ({ ...s, options: emoteIdsForSlot(s.slot) }));
  readonly emotes = EMOTES;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: BattleCriesDialogData,
    private dialogRef: MatDialogRef<BattleCriesDialogComponent>,
    private draftService: DraftService,
  ) {}

  pick(slot: BattleCrySlot, emoteId: string): void {
    if (this.data.cries()[slot] === emoteId) return;
    this.draftService.sendMessage('set_battle_cry', { slot, emoteId });
  }

  close(): void {
    this.dialogRef.close();
  }
}
