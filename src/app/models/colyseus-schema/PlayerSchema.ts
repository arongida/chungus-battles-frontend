import {
  ArraySchema,
  MapSchema,
  Schema,
  type,
} from '@colyseus/schema';
import { Talent } from './TalentSchema';
import Item from './ItemSchema';
import { ItemCollection } from './ItemCollectionSchema';
import { AffectedStats } from './AffectedStatsSchema';

export class Player extends Schema {
  // Fields in the same declaration order as the backend schema (required for skipHandshake compatibility)
  @type('number') playerId: number = 0;
  @type('number') originalPlayerId: number = 0;
  @type('string') name: string = 'name';
  @type('number') xp: number = 0;
  @type('string') sessionId: string = 'sessionId';
  @type('number') maxXp: number = 0;
  @type('number') round: number = 1;
  @type('number') lives: number = 3;
  @type('number') wins: number = 0;
  @type('string') avatarUrl: string =
    'assets/Portrait_ID_0_Placeholder.png';
  @type('number') gameVersion: number = 0;
  @type('number') income: number = 0;
  @type('number') hpRegen: number = 0;
  @type([Talent]) talents: ArraySchema<Talent> = new ArraySchema<Talent>();
  @type([Item]) inventory: ArraySchema<Item> = new ArraySchema<Item>();
  @type([Item]) lockedShop: ArraySchema<Item> = new ArraySchema<Item>();
  @type({ map: Item }) equippedItems = new MapSchema<Item>();
  @type('number') dodgeRate: number = 0;
  @type('number') refreshShopCost: number = 2;
  @type('number') maxHp: number = 0;
  @type('number') private _hp: number = 0;
  @type(AffectedStats) baseStats: AffectedStats = new AffectedStats();
  @type('number') private _accuracy: number = 0;
  @type('number') private _strength: number = 0;
  @type('number') private _gold: number = 0;
  @type('number') private _level: number = 0;
  @type('number') private _defense: number = 0;
  @type('number') private _attackSpeed: number = 0;
  @type('boolean') invincible: boolean = false;
  @type('number') losses: number = 0;
  // Comrade: true while a free-item claim is available for the current shop (see backend
  // TalentBehaviors.ts / PlayerSchema.ts) — lets the client present any shop item as claimable-free.
  @type('boolean') comradeFreeClaim: boolean = false;
  // Gold Genie: same latch as comradeFreeClaim, but the client only honors it on merchant-class
  // shop items (see backend TalentBehaviors.ts GOLD_GENIE).
  @type('boolean') goldGenieFreeClaim: boolean = false;
  // Black Market Contact: same latch as comradeFreeClaim, but the client only honors it on
  // lucky-find shop items (see backend TalentBehaviors.ts BLACK MARKET CONTRACT).
  @type('boolean') luckyFindFreeClaim: boolean = false;
  // Misconduct: same latch as comradeFreeClaim (any unsold shop item), but the claimed item
  // also gets a rarity upgrade + full-price sell value (see backend TalentBehaviors.ts MISCONDUCT).
  @type('boolean') misconductFreeClaim: boolean = false;
  // Deprecated — see backend PlayerSchema.ts's comment. Health Flask brews now bank into
  // pendingPotionEffects below; kept declared (never populated) so field indices stay stable.
  @type('number') pendingRegenBuff: number = 0;
  // Hidden shop-roll stat, synced so the client can display it next to gold/income (see backend
  // PlayerSchema.ts comment).
  @type('number') luckyFindChance: number = 0;
  // Store Credit (item skill): same latch as comradeFreeClaim, but the client only honors it on
  // shop items priced at or below storeCreditFreeClaimCap (see backend ItemSkillBehaviors.ts
  // STORE_CREDIT).
  @type('boolean') storeCreditFreeClaim: boolean = false;
  @type('number') storeCreditFreeClaimCap: number = 0;
  // Free shop rerolls (Haggler item skill + Bargain Hunter talent): remaining free rerolls for the
  // current shop phase, shared across both sources (see backend ItemSkillBehaviors.ts HAGGLER /
  // TalentBehaviors.ts BARGAIN_HUNTER / PlayerSchema.ts).
  @type('number') freeRerollCharges: number = 0;
  // Fortune's Fool (talent 403): reroll count for the current shop phase (see backend
  // PlayerSchema.ts / DraftRoom.refreshShop).
  @type('number') rerollsThisRound: number = 0;
  // Fortune's Fool (talent 403, aura): true while owned — the shop reroll button should show
  // FREE instead of the gold cost (see backend PlayerSchema.ts / DraftAuraTriggerCommand).
  @type('boolean') freeRerolls: boolean = false;
  // Cooldown reduction: shortens active-skill intervals (see backend common/cooldown.ts /
  // commands/triggers/ActiveTriggerCommand.ts). Declared here (end of the backend @type block)
  // so field indices stay stable — same reasoning as freeRerolls and its neighbors above.
  @type('number') cooldownReduction: number = 0;
  // Shield Bash (item skill): true while stunned — mirrors `invincible` above. Declared here (end
  // of the backend @type block) so field indices stay stable — same reasoning as cooldownReduction.
  @type('boolean') stunned: boolean = false;
  // Health Flask brews banked in the draft for the wearer's next fight only — one skillId per
  // flask drunk (see backend PlayerSchema.ts / items/skills/itemSkillRoller.ts's
  // ensurePotionEffect). Declared here (end of the backend @type block) so field indices stay
  // stable, same reasoning as stunned and its neighbors above.
  @type(['number']) pendingPotionEffects: ArraySchema<number> = new ArraySchema<number>();
  // Comma-joined brew names for pendingPotionEffects, rebuilt server-side on every drink — lets
  // the UI show "Brewing: Antidote, Stoneskin" without needing the item-skill name table.
  @type('string') pendingPotionSummary: string = '';
  // How many potions pendingPotionEffects may hold at once (see backend PlayerSchema.ts /
  // ShopUpgradeUtils.BASE_POTION_CAPACITY / Flash Sale). Declared here (end of the backend
  // @type block) so field indices stay stable, same reasoning as pendingPotionSummary above.
  @type('number') potionCapacity: number = 1;
  // Frontend-only fields not present in backend schema (placed last to preserve index alignment)
  @type([ItemCollection]) activeItemCollections: ArraySchema<ItemCollection> =
    new ArraySchema<ItemCollection>();
  @type([ItemCollection])
  availableItemCollections: ArraySchema<ItemCollection> =
    new ArraySchema<ItemCollection>();
  // Not synced — server-only computation, no @type
  private _poisonStack: number = 0;
  // Leaderboard-only display field: ISO timestamp of this character's last-saved snapshot,
  // returned by /leaderboard and /wallOfFame (derived from the snapshot doc's _id on the
  // backend). Not present on live draft/fight room state, so it's left undecorated (no @type).
  lastPlayedAt?: string;
  // "Runs ended" leaderboard stat: how many other characters' final loss this character
  // delivered. Returned by /leaderboard and /wallOfFame. Not present on live room state.
  runsEnded?: number;
  // This character's nemesis — set once at this character's own game-over. Returned by
  // /leaderboard, /wallOfFame and /playerBuild. Not present on live room state.
  killedByPlayerId?: number;
  killedByOriginalPlayerId?: number;
  killedByName?: string;

  get gold(): number {
    return this._gold;
  }

  set gold(value: number) {
    this._gold = value < 0 ? 0 : value;
  }

  get level(): number {
    return this._level;
  }

  set level(value: number) {
    this._level = value < 1 ? 1 : value;
  }

  get attackSpeed(): number {
    return this._attackSpeed;
  }

  set attackSpeed(value: number) {
    this._attackSpeed = value < 0.1 ? 0.1 : value;
  }

  get hp(): number {
    return this._hp;
  }

  set hp(value: number) {
    this._hp = value < 0 ? 0 : value;
  }

  get strength(): number {
    return this._strength;
  }

  set strength(value: number) {
    this._strength = value < 1 ? 1 : value;
  }

  get accuracy(): number {
    return this._accuracy;
  }

  set accuracy(value: number) {
    this._accuracy = value < 1 ? 1 : value;
  }

  get poisonStack(): number {
    return this._poisonStack;
  }

  set poisonStack(value: number) {
    // Clamp mirrors backend PlayerSchema.ts's poisonStack setter (1000, not 50).
    if (value < 0) {
      this._poisonStack = 0;
    } else if (value > 1000) {
      this._poisonStack = 1000;
    } else {
      this._poisonStack = value;
    }
  }

  get defense(): number {
    return this._defense;
  }

  set defense(value: number) {
    this._defense = value < 0 ? 0 : value;
  }

  getAllItems(): Item[] {
    const allItems = [...this.inventory];
    this.equippedItems.forEach((value) => {
      allItems.push(value);
    });
    return allItems;
  }

  setLockedShopToDefault(){
    this.lockedShop = new ArraySchema<Item>();
  }
}
