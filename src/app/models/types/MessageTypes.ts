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

// Shield Bash (item skill): mirrors InvulnerableStateMessage above.
export type StunnedStateMessage = {
  playerId: number;
  stunned: boolean;
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
  // True when a Mythic buy/upgrade just granted the permanent Lucky Find bonus — pops a
  // floating "+N% 🍀" number and a mythic fireworks burst on the avatar instead of the
  // shop card (see DraftRoom.buyItem / PlayerSchema.luckyFindMythicBonus /
  // ShopUpgradeUtils.LUCKY_FIND_MYTHIC_BONUS).
  luckyFind?: boolean;
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
  replayId?: string;
  stats?: FightStatsMessage;
};

/** Run truly over (lives exhausted). Object payload so the client can offer the same
 *  Stats/Watch Replay actions as end_battle. `replayId`/`stats` are absent on older replays
 *  recorded before this message carried them — and on replays recorded before this change
 *  shipped, the whole payload is a plain string instead of this object. */
export type GameOverMessage = {
  message: string;
  replayId?: string;
  stats?: FightStatsMessage;
};

export type LossRewardChoice = 'gold' | 'xp' | 'item_upgrade';

/** Offered to the losing player on end_battle — pick one via select_loss_reward. */
export type LossRewardOptions = {
  goldAmount: number;
  xpAmount: number; // 50% more than gold — gold is the more flexible pick
  itemUpgradeAvailable: boolean;
  itemUpgradeCount: number; // how many rarity-upgrade rolls this pick grants (1-3, scales with lives left)
};

/** Resolution of the loss-reward choice; for item_upgrade reveals which item(s) got
 *  upgraded. `item` holds the first upgraded item for back-compat; `items` holds all of
 *  them (more than one when the player was on their last or second-to-last life). */
export type LossRewardResultMessage = {
  choice: LossRewardChoice;
  gold?: number;
  xp?: number;
  item?: { itemId: number; name: string; rarity: number };
  items?: { itemId: number; name: string; rarity: number }[];
};

/** Client → server: set the fight time scale (0.5, 1 or 2); synced back as FightState.timeScale. */
export type SetFightSpeedMessage = {
  speed: number;
};

export type FightSideStats = {
  damageDealt: { weapon: number; skill?: number; burn: number; poison: number }; // skill optional — absent on pre-skill-damage-tracking replays (weapon included skill damage back then)
  healingReceived: number;
  damageReducedByDefense: number;
  attacksDodged: number;
  damageBlockedByInvincible?: number; // optional — absent on pre-Season-16 replays
  attacksBlocked?: number; // optional — absent on pre-Season-22 replays (Brace rework)
  damageBlocked?: number; // optional — absent on pre-Season-22 replays (Brace rework)
  empoweredAttacks?: number; // optional — absent on pre-Season-22 replays
  empoweredDamage?: number; // optional — absent on pre-Season-22 replays
};

export type FightStatsMessage = {
  player: FightSideStats;
  enemy: FightSideStats;
};

// Replay-only pseudo-event (see backend replay/StatsSyncRecorder.ts). NEVER sent to a live
// client — live clients get all of this via Colyseus schema sync every tick; replay playback has
// no schema sync, so the room folds the same information into the recorded event stream instead.
// Every value is ABSOLUTE (not a delta), but every field is OPTIONAL: only fields that changed
// since the previously emitted sync are present.
export type StatsSyncItem = {
  slot: string;
  skillStatus: string;
  // Weapon Whisperer's second skill slot — same "resent whenever either slot's status changed"
  // granularity as skillStatus above, not diffed independently.
  skillStatus2: string;
};

export type StatsSyncSide = {
  playerId: number;
  hp?: number;
  maxHp?: number;
  strength?: number;
  accuracy?: number;
  defense?: number;
  attackSpeed?: number;
  dodgeRate?: number;
  hpRegen?: number;
  income?: number;
  cooldownReduction?: number;
  /** Only equipped items whose live skillStatus line changed. */
  items?: StatsSyncItem[];
};

export type StatsSyncMessage = {
  player?: StatsSyncSide;
  enemy?: StatsSyncSide;
};

/** Cumulative fight stats for a character across the whole run — GET /gameStats. */
export type GameStatsResult = {
  fights: number;
  wins: number;
  losses: number;
  draws: number;
  stats: FightStatsMessage;
};

// --- Season-end Hall of Fame tournament — GET /tournament, GET /tournaments -------------------

export type TournamentGameResult = {
  gameIndex: number;
  aIsPlayer: boolean;
  result: 'win' | 'lose' | 'draw';
  replayId?: string;
  durationMs: number;
  winnerHpFraction?: number;
  aDamageDealt: number;
  aDamageTaken: number;
};

export type TournamentPairing = {
  aId: number;
  bId: number;
  aWins: number;
  bWins: number;
  draws: number;
  games: TournamentGameResult[];
  showcaseReplayId?: string;
};

export type TournamentStandingRow = {
  originalPlayerId: number;
  name: string;
  avatarUrl?: string;
  seed: number;
  fights: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  damageDealt: number;
  damageTaken: number;
  avgDurationMs: number;
};

export type TournamentMatch = {
  matchId: string;
  stage: 'SF1' | 'SF2' | 'FIN';
  aId: number;
  bId: number;
  aWins: number;
  bWins: number;
  games: TournamentGameResult[];
  winnerId?: number;
};

export type TournamentRosterEntry = {
  playerId: number;
  originalPlayerId: number;
  name: string;
  avatarUrl?: string;
  // Frozen snapshotPlayer() output the character actually fought the tournament with — the
  // same shape /playerBuild's playerToPlainObject produces, so buildPlayerFromData can
  // rehydrate it directly.
  snapshot?: Record<string, any>;
};

/** GET /tournament?season=N — the full record of one season's tournament. */
export type Tournament = {
  tournamentId: string;
  season: number;
  status: 'running' | 'complete' | 'failed' | 'skipped';
  createdAt: string;
  completedAt?: string;
  progress: { fightsDone: number; fightsTotal: number; stage: 'gauntlet' | 'playoff' | 'done' };
  roster: TournamentRosterEntry[];
  gauntlet: { pairings: TournamentPairing[]; table: TournamentStandingRow[] };
  playoff: { matches: TournamentMatch[] };
  championId?: number;
  championName?: string;
  championAvatarUrl?: string;
  runnerUpId?: number;
};

/** GET /tournaments — lightweight listing for the season selector. */
export type TournamentSummary = {
  season: number;
  status: 'running' | 'complete' | 'failed' | 'skipped';
  createdAt: string;
  completedAt?: string;
  championId?: number;
  championName?: string;
  championAvatarUrl?: string;
};

export type EndBattleMessage = {
  result: 'win' | 'lose' | 'draw';
  lossBonus?: number; // legacy (old replays)
  lossReward?: LossRewardOptions & { outcome?: LossRewardResultMessage };
  replayId?: string;
  stats?: FightStatsMessage;
  wins?: number;
};

/** Draft-phase lucky shop-roll announcement — floats over the shop card at `slot`
 *  instead of a snackbar toast (see TriggerAnimations.triggerShopFloatingText). */
export type ShopFloatingMessage = {
  slot: number;
  text: string;
  rarity?: number;
};