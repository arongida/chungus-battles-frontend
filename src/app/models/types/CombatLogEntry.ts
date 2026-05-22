export type CombatLogKind =
  | 'countdown' | 'fight_start' | 'fight_end' | 'end_burn'
  | 'attack' | 'dodge'
  | 'regen' | 'poison_apply' | 'poison_tick'
  | 'heal' | 'leech'
  | 'talent' | 'item'
  | 'reward' | 'xp' | 'result';

export interface CombatLogEntry {
  text: string;
  kind: CombatLogKind;
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
  goldDelta?: number;
  xpDelta?: number;
  result?: 'win' | 'lose' | 'draw';
}
