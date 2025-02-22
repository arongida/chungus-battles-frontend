export type DamageMessage = {
  playerId: number;
  damage: number;
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