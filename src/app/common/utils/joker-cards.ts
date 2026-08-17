import { Talent } from '../../models/colyseus-schema/TalentSchema';
import { DisplayStat, STAT_DISPLAY } from './stat-display';

/** talentId 41 = Joker — see chungus-battles-backend/src/talents/behavior/jokerState.ts, the
 *  authoritative source these encoded tags come from. */
export const JOKER_TALENT_ID = 41;

const CARD_TAG_PREFIX = 'joker-card:';

export interface JokerCard {
  stat: DisplayStat;
  amount: number;
  icon: string;
  label: string;
  /** Attack speed's amount is a raw bonus fraction (e.g. 0.05), matching what
   *  STAT_DISPLAY.attackSpeed.describe expects — see stat-display.ts's doc comment. */
  text: string;
}

/** Parses Joker's pending post-fight cards straight off Talent.tags — encoded server-side as
 *  `joker-card:<stat>:<amount>` (see jokerState.ts), no dedicated schema field needed. Returns
 *  [] once both cards have been resolved (picked, or the talent isn't owned at all). */
export function parseJokerCards(talents: Talent[] | undefined): JokerCard[] {
  const joker = talents?.find((t) => t.talentId === JOKER_TALENT_ID);
  if (!joker?.tags) return [];

  const cards: JokerCard[] = [];
  for (const tag of joker.tags) {
    if (!tag.startsWith(CARD_TAG_PREFIX)) continue;
    const [, stat, amountStr] = tag.split(':');
    const amount = Number(amountStr);
    const display = STAT_DISPLAY[stat as DisplayStat];
    if (!display) continue; // unknown/future stat — skip rather than render garbage
    cards.push({ stat: stat as DisplayStat, amount, icon: display.icon, label: display.label, text: display.describe(amount) });
  }
  return cards;
}
