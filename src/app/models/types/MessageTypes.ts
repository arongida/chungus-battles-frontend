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

export type GameWinMessage = {
  wins: number;
  losses: number;
  season: number;
};

export type LossRewardChoice = 'gold' | 'xp' | 'item_upgrade';

/** Offered to the losing player on end_battle — pick one via select_loss_reward. */
export type LossRewardOptions = {
  goldAmount: number;
  xpAmount: number; // 20% more than gold — gold is the more flexible pick
  itemUpgradeAvailable: boolean;
};

/** Resolution of the loss-reward choice; for item_upgrade reveals which item got upgraded. */
export type LossRewardResultMessage = {
  choice: LossRewardChoice;
  gold?: number;
  xp?: number;
  item?: { itemId: number; name: string; rarity: number };
};

/** Client → server: set the fight time scale (0.5, 1 or 2); synced back as FightState.timeScale. */
export type SetFightSpeedMessage = {
  speed: number;
};

export type FightSideStats = {
  damageDealt: { weapon: number; burn: number; poison: number };
  healingReceived: number;
  damageReducedByDefense: number;
  damageReducedByFlat: number;
  attacksDodged: number;
  damageBlockedByInvincible?: number; // optional — absent on pre-Season-16 replays
};

export type FightStatsMessage = {
  player: FightSideStats;
  enemy: FightSideStats;
};

/** Cumulative fight stats for a character across the whole run — GET /gameStats. */
export type GameStatsResult = {
  fights: number;
  wins: number;
  losses: number;
  draws: number;
  stats: FightStatsMessage;
};

export type EndBattleMessage = {
  result: 'win' | 'lose' | 'draw';
  lossBonus?: number; // legacy (old replays)
  lossReward?: LossRewardOptions & { outcome?: LossRewardResultMessage };
  replayId?: string;
  stats?: FightStatsMessage;
};

/** Draft-phase lucky shop-roll announcement — floats over the shop card at `slot`
 *  instead of a snackbar toast (see TriggerAnimations.triggerShopFloatingText). */
export type ShopFloatingMessage = {
  slot: number;
  text: string;
  rarity?: number;
};