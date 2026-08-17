/** The subset of AffectedStats fields talents/items commonly grant on the player's own side —
 *  shared icon/label/color/phrasing so a stat reads the same everywhere it shows up (talent-pick
 *  tooltips, Joker's card-pick dialog, etc.) instead of each component re-deriving its own copy.
 *  See TalentsComponent.buildStatEntries and JokerPickComponent for the two current call sites. */
export type DisplayStat =
  | 'strength'
  | 'accuracy'
  | 'attackSpeed'
  | 'maxHp'
  | 'defense'
  | 'dodgeRate'
  | 'income'
  | 'hpRegen'
  | 'cooldownReduction';

export interface StatDisplayDef {
  icon: string;
  label: string;
  color: string;
  /** Renders a signed delta inline, e.g. "+4 to max damage roll" or "+12% speed bonus".
   *  `attackSpeed` expects the raw bonus fraction (e.g. 0.12 for +12%), NOT the 1-based
   *  multiplier AffectedStats.attackSpeed stores on the wire — subtract 1 first if reading
   *  straight off a Talent/Item's affectedStats. */
  describe: (delta: number) => string;
}

const fmtSigned = (v: number) => (v > 0 ? `+${v}` : `${v}`);

export const STAT_DISPLAY: Record<DisplayStat, StatDisplayDef> = {
  strength: { icon: '⚔️', label: 'Strength', color: 'text-red-400', describe: (v) => `${fmtSigned(v)} to max damage roll` },
  accuracy: { icon: '🎯', label: 'Accuracy', color: 'text-red-400', describe: (v) => `${fmtSigned(v)} to min damage roll` },
  attackSpeed: { icon: '⏩', label: 'Attack Speed', color: 'text-blue-400', describe: (v) => `${fmtSigned(Math.round(v * 100))}% speed bonus` },
  maxHp: { icon: '❤️', label: 'Max HP', color: 'text-pink-400', describe: (v) => `${fmtSigned(v)} max health` },
  defense: { icon: '🛡️', label: 'Defense', color: 'text-green-400', describe: (v) => `${fmtSigned(v)} defense` },
  dodgeRate: { icon: '🦵', label: 'Dodge', color: 'text-green-400', describe: (v) => `${fmtSigned(v)} dodge rating` },
  income: { icon: '💰', label: 'Income', color: 'text-yellow-400', describe: (v) => `${fmtSigned(v)} gold per fight` },
  hpRegen: { icon: '🧪', label: 'HP Regen', color: 'text-orange-400', describe: (v) => `${fmtSigned(v)} HP per second` },
  cooldownReduction: { icon: '⏳', label: 'Cooldown Reduction', color: 'text-purple-400', describe: (v) => `${fmtSigned(v)} rating — active skills fire faster` },
};
