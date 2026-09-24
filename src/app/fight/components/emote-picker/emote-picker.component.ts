import { Component, computed, input, output, signal } from '@angular/core';
import { EMOTES, emoteIdsForSlot } from '../../../common/social/emote-catalog';

/** Preset reactions the local player can send during/after a fight. The server enforces the
 *  per-fight cap and cooldown; `remaining` comes from its reaction broadcasts. The short local
 *  lockout after a click only mirrors the server's cooldown so buttons don't look clickable
 *  while a press would be silently dropped. */
@Component({
  selector: 'app-emote-picker',
  standalone: true,
  templateUrl: './emote-picker.component.html',
  styleUrl: './emote-picker.component.scss',
})
export class EmotePickerComponent {
  /** 'popover': one 💬 toggle that opens the full list (fight HUD).
   *  'inline': a short row of quick reactions (end-of-fight modals). */
  mode = input<'popover' | 'inline'>('popover');
  remaining = input<number>(0);
  /** Inline mode only: which reactions to show. */
  quick = input<string[]>(['react_gg', 'react_wp']);
  send = output<string>();

  readonly reactions = emoteIdsForSlot('reaction');
  readonly emotes = EMOTES;
  open = signal(false);
  coolingDown = signal(false);
  disabled = computed(() => this.remaining() <= 0 || this.coolingDown());

  private static readonly LOCAL_COOLDOWN_MS = 2000;

  pick(emoteId: string): void {
    if (this.disabled()) return;
    this.send.emit(emoteId);
    this.open.set(false);
    this.coolingDown.set(true);
    setTimeout(() => this.coolingDown.set(false), EmotePickerComponent.LOCAL_COOLDOWN_MS);
  }
}
