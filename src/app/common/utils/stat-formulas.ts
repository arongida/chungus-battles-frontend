/** Mirrors Player.getDodgeChance on the backend. */
export function dodgeChance(dodgeRate: number): number {
  return 1 - 100 / (100 + (dodgeRate ?? 0));
}

/** Mirrors the backend's applyCooldownReduction (common/cooldown.ts): the same hyperbolic
 *  shape as the defense formula above, so it converts a cooldownReduction rating into the
 *  fraction an active skill's interval actually shrinks by (never reaching 100%). */
export function cooldownReductionPct(cooldownReduction: number): number {
  const cdr = Math.max(0, cooldownReduction ?? 0);
  return 1 - 100 / (100 + cdr);
}

/** Base seconds between activations for a TriggerType.ACTIVE talent/item, from its
 *  activationRate (activations per second) — mirrors ActiveTriggerCommand's
 *  `(1 / talent.activationRate) * 1000` on the backend. */
export function activeIntervalSeconds(activationRate: number): number {
  return activationRate > 0 ? 1 / activationRate : 0;
}

/** Same, shortened by the player's cooldownReduction — mirrors the backend's
 *  applyCooldownReduction applied to that same base interval. */
export function activeIntervalSecondsWithCdr(activationRate: number, cooldownReduction: number): number {
  return activeIntervalSeconds(activationRate) * (1 - cooldownReductionPct(cooldownReduction));
}
