export type CombatLogKind =
  | 'countdown' | 'fight_start' | 'fight_end' | 'end_burn'
  | 'attack' | 'dodge' | 'counter'
  | 'regen' | 'poison_apply' | 'poison_tick'
  | 'burn_apply' | 'burn_tick'
  | 'heal' | 'leech'
  | 'talent' | 'item'
  | 'invulnerable'
  | 'reward' | 'xp' | 'result';

export interface CombatLogEntry {
  text: string;
  kind: CombatLogKind;
  // Monotonic sequence number stamped by the server — used to reorder entries that
  // may arrive out of order (mix of broadcast + per-client send).
  seq?: number;
  attackerId?: number;
  defenderId?: number;
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
