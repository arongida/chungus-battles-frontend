// Shop-phase quips: short lines the player's OWN character says in a speech bubble while they
// shop. The server only sends which thing happened (QuipMessage.trigger — see the backend's
// DraftRoom.quip); the lines and the "should it speak right now" throttle live here, so adding
// or rewording lines is a frontend-only change.

import { QuipTrigger } from '../../models/types/MessageTypes';

export const QUIPS: Record<QuipTrigger, string[]> = {
  buy: [
    'Ooh, shiny.',
    'Retail therapy.',
    'Worth every coin. Probably.',
    "I'll pretend I needed that.",
    'Add it to the pile.',
  ],
  sell: [
    'It was holding me back.',
    'No refunds. Wait—',
    'Someone else can have it.',
    'Decluttering!',
  ],
  reroll: [
    'Show me something good this time.',
    'Gambling is a strategy.',
    'Nope. Next.',
    'Surely this time.',
  ],
  level_up: [
    'I feel smarter already.',
    'Look at me, all grown up.',
    'Level up! Still broke.',
    'New me, same problems.',
  ],
  talent: [
    'Ah yes, a personality.',
    'I have a plan now. Sort of.',
    'Very talented, me.',
  ],
  broke: [
    'My wallet says no.',
    'Maybe if I shake the purse...',
    'Window shopping it is.',
    'Money? Never heard of her.',
  ],
};

/** Keeps the character from narrating every click: speaks only sometimes, never more than once
 *  per MIN_GAP_MS, and never repeats its previous line for the same trigger. "broke" always gets
 *  a line (still gap-limited) — it's feedback for a failed action. */
export class QuipPicker {
  private static readonly MIN_GAP_MS = 10_000;
  private static readonly CHANCE = 0.4;
  private lastSpokeAt = -Infinity;
  private lastLine = new Map<QuipTrigger, string>();

  next(trigger: QuipTrigger, now = Date.now()): string | null {
    const lines = QUIPS[trigger];
    if (!lines?.length) return null;
    if (now - this.lastSpokeAt < QuipPicker.MIN_GAP_MS) return null;
    if (trigger !== 'broke' && Math.random() >= QuipPicker.CHANCE) return null;
    const previous = this.lastLine.get(trigger);
    const pool = lines.length > 1 ? lines.filter(l => l !== previous) : lines;
    const line = pool[Math.floor(Math.random() * pool.length)];
    this.lastLine.set(trigger, line);
    this.lastSpokeAt = now;
    return line;
  }
}
