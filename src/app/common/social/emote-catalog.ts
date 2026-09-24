// Preset social lines — mirror of the backend's src/social/emotes.ts (ids and slots must match;
// the backend's test/emoteCatalogParity.test.ts enforces it). The server only ever sends/accepts
// ids; the text lives here so it renders without a round trip. Ids are persisted, so never rename
// or delete one — add new ids instead.

export type EmoteSlot = 'greeting' | 'victory' | 'defeat' | 'reaction';
export type BattleCrySlot = Exclude<EmoteSlot, 'reaction'>;

export interface EmoteDef {
  slot: EmoteSlot;
  text: string;
  /** Reactions only — shown on the picker button and in ghost-report chips. */
  icon?: string;
}

export const EMOTES: Record<string, EmoteDef> = {
  greet_hello: { slot: 'greeting', text: 'Greetings, traveler.' },
  greet_dance: { slot: 'greeting', text: "Let's dance!" },
  greet_behold: { slot: 'greeting', text: 'Behold, the mighty Chungus!' },
  greet_luck: { slot: 'greeting', text: "Good luck. You'll need it." },
  greet_lunch: { slot: 'greeting', text: 'Is it lunch yet?' },
  greet_best: { slot: 'greeting', text: 'May the best build win.' },

  win_gg: { slot: 'victory', text: 'Good game!' },
  win_prevails: { slot: 'victory', text: 'Chungus prevails!' },
  win_gold: { slot: 'victory', text: 'Thanks for the gold!' },
  win_close: { slot: 'victory', text: 'Phew, that was close.' },
  win_stronger: { slot: 'victory', text: 'Come back stronger!' },
  win_all: { slot: 'victory', text: 'Was that all?' },

  lose_fought: { slot: 'defeat', text: 'Well fought.' },
  lose_remember: { slot: 'defeat', text: "I'll remember this..." },
  lose_lucky: { slot: 'defeat', text: 'Lucky roll!' },
  lose_shop: { slot: 'defeat', text: 'I blame the shop.' },
  lose_ouch: { slot: 'defeat', text: 'Ouch.' },
  lose_next: { slot: 'defeat', text: 'Next time, friend.' },

  react_wp: { slot: 'reaction', text: 'Well played!', icon: '👏' },
  react_gg: { slot: 'reaction', text: 'GG', icon: '🤝' },
  react_wow: { slot: 'reaction', text: 'Wow!', icon: '😮' },
  react_thanks: { slot: 'reaction', text: 'Thanks!', icon: '🙏' },
  react_oops: { slot: 'reaction', text: 'Oops...', icon: '😅' },
  react_sorry: { slot: 'reaction', text: 'Sorry!', icon: '😬' },
  react_grr: { slot: 'reaction', text: "I'm coming for you!", icon: '😤' },
};

export const BATTLE_CRY_SLOTS: { slot: BattleCrySlot; label: string; hint: string }[] = [
  { slot: 'greeting', label: 'Greeting', hint: 'Said when the battle begins' },
  { slot: 'victory', label: 'Victory', hint: 'Said when you win' },
  { slot: 'defeat', label: 'Defeat', hint: 'Said when you lose' },
];

export function emoteIdsForSlot(slot: EmoteSlot): string[] {
  return Object.keys(EMOTES).filter(id => EMOTES[id].slot === slot);
}

export function emoteText(emoteId: string): string {
  return EMOTES[emoteId]?.text ?? '';
}

export function emoteIcon(emoteId: string): string {
  return EMOTES[emoteId]?.icon ?? '💬';
}

/** Same limit the server enforces (MAX_REACTIONS_PER_FIGHT) — used only for the initial label;
 *  the live count comes from the server's `remaining` on each reaction broadcast. */
export const MAX_REACTIONS_PER_FIGHT = 5;
