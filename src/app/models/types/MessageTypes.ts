export type DamageType = 'normal' | 'poison' | 'burn';

export type DamageMessage = {
  playerId: number;
  damage: number;
  type?: DamageType;
};

export type InvulnerableMessage = {
  playerId: number;
  damage: number;
};

export type InvulnerableStateMessage = {
  playerId: number;
  invincible: boolean;
};

export type HealingMessage = {
  playerId: number;
  healing: number;
};

export type TriggerTalentMessage = {
  playerId: number;
  talentId: number;
};

export type TriggerCollectionMessage = {
  playerId: number;
  collectionId: number;
};

export type TriggerItemMessage = {
  playerId: number;
  itemId: number;
  slot: string;
};

export type VersionWinMessage = {
  wins: number;
};

export type EndBattleMessage = {
  result: 'win' | 'lose' | 'draw';
  lossBonus?: number;
};