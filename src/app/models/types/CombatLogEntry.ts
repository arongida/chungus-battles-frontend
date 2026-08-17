export type CombatLogKind =
  | 'countdown' | 'fight_start' | 'fight_end' | 'end_burn'
  | 'attack' | 'dodge' | 'counter' | 'block'
  | 'regen' | 'poison_apply' | 'poison_tick'
  | 'burn_apply' | 'burn_tick'
  | 'heal' | 'leech'
  | 'talent' | 'item'
  | 'invulnerable' | 'stun'
  | 'reward' | 'xp' | 'result';

export interface CombatLogEntry {
  text: string;
  kind: CombatLogKind;
  // Monotonic sequence number stamped by the server — used to reorder entries that
  // may arrive out of order (mix of broadcast + per-client send).
  seq?: number;
  // Fight-elapsed game time in ms at the moment this entry was emitted (0 before the battle
  // starts). Mirrors the backend's CombatLogMessage.t.
  t?: number;
  attackerId?: number;
  defenderId?: number;
  // kind: 'stun' only — who actually got stunned. A separate field because attacker/defender
  // roles flip depending on the source: Shield Bash stuns the incoming striker (attackerId),
  // Bully stuns the target (defenderId) — see fight-animation.service.ts.
  stunnedPlayerId?: number;
  weaponItemId?: number;
  itemId?: number;
  talentId?: number;
  slot?: string;
  damage?: number;
  rolledDamage?: number;
  mitigatedDamage?: number;
  defenderHpAfter?: number;
  healing?: number;
  poisonStacks?: number;
  burnStacks?: number;
  goldDelta?: number;
  xpDelta?: number;
  result?: 'win' | 'lose' | 'draw';
}
