/** Mirrors Player.getDodgeChance on the backend: attacker accuracy cancels dodge 1:1,
 *  so enough accuracy removes dodge entirely. */
export function dodgeChance(dodgeRate: number, attackerAccuracy = 0): number {
  const effective = Math.max(0, (dodgeRate ?? 0) - (attackerAccuracy ?? 0));
  return 1 - 100 / (100 + effective);
}

/** Mirrors the backend's applyCooldownReduction (common/cooldown.ts): the same hyperbolic
 *  shape as the defense formula above, so it converts a cooldownReduction rating into the
 *  fraction an active skill's interval actually shrinks by (never reaching 100%). */
export function cooldownReductionPct(cooldownReduction: number): number {
  const cdr = Math.max(0, cooldownReduction ?? 0);
  return 1 - 100 / (100 + cdr);
}
