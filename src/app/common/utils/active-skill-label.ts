import { activeIntervalSeconds, activeIntervalSecondsWithCdr } from './stat-formulas';

/** Raw trigger-type string the server uses for TriggerType.ACTIVE (see backend common/types.ts).
 *  There is no TriggerType enum on the frontend — talents/items only ever carry this as a
 *  string in their triggerTypes array. */
export const ACTIVE_TRIGGER = 'active';

export interface ActiveSkillLabel {
  /** Triggers other than 'active', for the existing grey ⚡ line — empty array, never undefined. */
  otherTriggers: string[];
  /** Cadence text for the purple ⏳ line ("Active — every 2.0s"), or null when the talent/item
   *  isn't ACTIVE. Callers own the emoji/color styling. */
  activeText: string | null;
}

/** Splits a talent/item's triggerTypes into the ACTIVE cadence line and the rest, so every
 *  surface (talent card, talent picker, encyclopedia, item card) renders the same purple
 *  ⏳ "Active — every Xs" text used elsewhere for cooldownReduction, instead of dumping 'active'
 *  into the generic grey trigger list. `cooldownReduction` is the viewing player's rating — omit
 *  it (or pass 0) to show base cadence only, e.g. in the encyclopedia where there's no player
 *  context. `activationRate` of 0/undefined (item skills, which carry no rate) falls back to a
 *  bare "Active" with no cadence. */
export function buildActiveSkillLabel(
  triggerTypes: Iterable<string> | undefined,
  activationRate: number | undefined,
  cooldownReduction = 0,
): ActiveSkillLabel {
  const triggers = triggerTypes ? Array.from(triggerTypes) : [];
  const otherTriggers = triggers.filter(t => t !== ACTIVE_TRIGGER);

  if (!triggers.includes(ACTIVE_TRIGGER)) {
    return { otherTriggers, activeText: null };
  }

  const base = activeIntervalSeconds(activationRate ?? 0);
  if (!base) {
    return { otherTriggers, activeText: 'Active' };
  }

  const cdr = Math.max(0, cooldownReduction ?? 0);
  if (cdr > 0) {
    const effective = activeIntervalSecondsWithCdr(activationRate!, cdr);
    return { otherTriggers, activeText: `Active — every ${effective.toFixed(1)}s (base ${base.toFixed(1)}s)` };
  }
  return { otherTriggers, activeText: `Active — every ${base.toFixed(1)}s` };
}
