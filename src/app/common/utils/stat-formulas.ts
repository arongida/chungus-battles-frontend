/** Mirrors Player.getDodgeChance on the backend: attacker accuracy cancels dodge 1:1,
 *  so enough accuracy removes dodge entirely. */
export function dodgeChance(dodgeRate: number, attackerAccuracy = 0): number {
  const effective = Math.max(0, (dodgeRate ?? 0) - (attackerAccuracy ?? 0));
  return 1 - 100 / (100 + effective);
}
