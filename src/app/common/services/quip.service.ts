import { inject, Injectable, PLATFORM_ID, RendererFactory2 } from '@angular/core';
import { QuipTrigger } from '../../models/types/MessageTypes';
import { QuipPicker } from '../social/quips';
import { triggerSpeechBubble } from '../TriggerAnimations';

/** One shared throttle for the player's shop quips, whichever side noticed the action: the
 *  server's `quip` message (DraftRoomComponent), or the client itself for actions it rejects
 *  before anything is sent — e.g. clicking Buy on an unaffordable item, which only shakes the
 *  button (item-card.component.ts) and never reaches the server. */
@Injectable({ providedIn: 'root' })
export class QuipService {
  private readonly picker = new QuipPicker();
  private readonly renderer = inject(RendererFactory2).createRenderer(null, null);
  private readonly platformId = inject(PLATFORM_ID);

  say(trigger: QuipTrigger, playerId: number | undefined): void {
    if (!playerId) return;
    const line = this.picker.next(trigger);
    if (line) triggerSpeechBubble(this.renderer, this.platformId, playerId, line);
  }
}
