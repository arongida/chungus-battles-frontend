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

/** Fired whenever a player gains gold and/or xp, so the client can pop floating
 *  +gold/+xp text over the player's avatar (during fight or shop round). Gains only —
 *  spends are not represented here. Either field may be omitted if not gained. */
export type RewardGainMessage = {
  playerId: number;
  gold?: number;
  xp?: number;
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
  replayId?: string;
};

/** Draft-phase lucky shop-roll announcement — floats over the shop card at `slot`
 *  instead of a snackbar toast (see TriggerAnimations.triggerShopFloatingText). */
export type ShopFloatingMessage = {
  slot: number;
  text: string;
  rarity?: number;
};