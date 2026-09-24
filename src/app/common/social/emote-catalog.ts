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
  greet_hello: { slot: 'greeting', text: "Oh good, another victim." },
  greet_dance: { slot: 'greeting', text: "Let's make this quick, I have shopping to do." },
  greet_behold: { slot: 'greeting', text: "Behold! Mediocrity, perfected." },
  greet_luck: { slot: 'greeting', text: "Good luck. You'll need all of it." },
  greet_lunch: { slot: 'greeting', text: "Is it lunch yet?" },
  greet_best: { slot: 'greeting', text: "May the best build win. So, me." },
  greet_ghost: { slot: 'greeting', text: "Relax, I'm only a ghost. A very angry one." },
  greet_nap: { slot: 'greeting', text: "Wake me up when it's over." },
  greet_tooltips: { slot: 'greeting', text: "Did you read the tooltips? I didn't." },

  win_gg: { slot: 'victory', text: "Good game! Well, for me." },
  win_prevails: { slot: 'victory', text: "Chungus prevails. As foretold." },
  win_gold: { slot: 'victory', text: "Thanks for the donation!" },
  win_close: { slot: 'victory', text: "Phew, that was close. Kidding." },
  win_stronger: { slot: 'victory', text: "Come back when you've read the tooltips." },
  win_all: { slot: 'victory', text: "Was that... all?" },
  win_skill: { slot: 'victory', text: "Skill issue." },
  win_autograph: { slot: 'victory', text: "Please, no autographs." },
  win_nap: { slot: 'victory', text: "I barely woke up for that." },

  lose_fought: { slot: 'defeat', text: "Well fought. I let you win." },
  lose_remember: { slot: 'defeat', text: "I'll remember this..." },
  lose_lucky: { slot: 'defeat', text: "Lucky roll. Obviously." },
  lose_shop: { slot: 'defeat', text: "The shop hates me. Personally." },
  lose_ouch: { slot: 'defeat', text: "Ouch. Mostly my pride." },
  lose_next: { slot: 'defeat', text: "Enjoy it. My ghost is plotting." },
  lose_lag: { slot: 'defeat', text: "Lag." },
  lose_intended: { slot: 'defeat', text: "Working as intended." },
  lose_warmup: { slot: 'defeat', text: "That was my warm-up." },

  react_wp: { slot: 'reaction', text: "Okay, that was good.", icon: "👏" },
  react_gg: { slot: 'reaction', text: "GG", icon: "🤝" },
  react_wow: { slot: 'reaction', text: "Wow. Rude.", icon: "😮" },
  react_thanks: { slot: 'reaction', text: "Thanks, I guess?", icon: "🙏" },
  react_oops: { slot: 'reaction', text: "Oops. Totally meant that.", icon: "😅" },
  react_sorry: { slot: 'reaction', text: "Sorry! (not sorry)", icon: "😬" },
  react_grr: { slot: 'reaction', text: "I know where your ghost lives.", icon: "😤" },
  react_popcorn: { slot: 'reaction', text: "Great show. 10/10.", icon: "🍿" },
  react_rng: { slot: 'reaction', text: "RNG strikes again.", icon: "🎲" },
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
