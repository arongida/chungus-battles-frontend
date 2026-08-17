import { Component, computed } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { DraftService } from '../../services/draft.service';
import { SoundOptions, SoundsService } from '../../../common/services/sounds.service';
import { CharacterDetailsService } from '../../../common/services/character-details.service';
import { JokerCard } from '../../../common/utils/joker-cards';

/**
 * Opened via MatDialog from DraftToolbarComponent, same CDK-overlay reasoning as
 * TalentsComponent (immune to the toolbar host's own stacking context). Reads its data from
 * CharacterDetailsService.jokerCards, mirrored there by the toolbar the same way
 * availableTalents is for TalentsComponent — see jokerCards' doc comment.
 *
 * Dismissable like the talent picker (backdrop click / toolbar toggle both close it without
 * picking) — that's deliberate: leaving a card unpicked is the whole point of Joker's downside
 * (see jokerState.ts on the backend), so the dialog must never force a choice. The toolbar's
 * "Joker" button stays lit for as long as a card is pending, so the player can always come back.
 */
@Component({
  selector: 'app-joker-pick',
  standalone: true,
  imports: [MatDialogModule],
  templateUrl: './joker-pick.component.html',
  styleUrl: './joker-pick.component.scss',
})
export class JokerPickComponent {
  cards = computed(() => this.characterDetailsService.jokerCards());

  constructor(
    public draftService: DraftService,
    private soundsService: SoundsService,
    private characterDetailsService: CharacterDetailsService,
    private dialogRef: MatDialogRef<JokerPickComponent>,
  ) {
  }

  pick(card: JokerCard): void {
    this.soundsService.playSound(SoundOptions.CLICK);
    this.draftService.sendMessage('joker_pick', { stat: card.stat });
    this.dialogRef.close();
  }

  close(): void {
    this.dialogRef.close();
  }
}
