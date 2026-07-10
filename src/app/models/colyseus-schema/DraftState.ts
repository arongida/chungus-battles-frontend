import {
  ArraySchema,
  Schema,
  type,
} from '@colyseus/schema';
import { Player } from './PlayerSchema';
import Item from './ItemSchema';
import { Talent } from './TalentSchema';
import { ItemCollection } from './ItemCollectionSchema';

export class DraftState extends Schema {
  @type(Player) player: Player = new Player();
  @type([Item]) shop: ArraySchema<Item> = new ArraySchema<Item>();
  @type([Talent]) availableTalents: ArraySchema<Talent> =
    new ArraySchema<Talent>();
  @type('number') shopSize: number = 6;
  @type('number') shopRefreshCost: number = 2;
  @type('number') remainingTalentPoints: number = 0;
  @type('boolean') hasFreeTalentReroll: boolean = false;
  @type('number') talentRerollCost: number = 0;
  @type([Item]) questItems: ArraySchema<Item> = new ArraySchema<Item>();
  // Drives the "Undo sell" button — true while the most recent sale can still be reverted.
  @type('boolean') canUndoSell: boolean = false;
  // Next-Enemy Preview: server-side-redacted preview of the locked-in next opponent.
  // Must stay in the exact same declaration order as the backend DraftState (skipHandshake).
  @type(Player) nextEnemy: Player = new Player();
  @type('number') nextEnemyRevealLevel: number = -1; // -1 = not populated → badge hidden
  // Talent/item CLASSES (rogue/warrior/merchant) of the next opponent — classes only,
  // duplicates kept so ×N counts are visible. Same order as backend (skipHandshake).
  @type(['string']) nextEnemyTalentClasses: ArraySchema<string> = new ArraySchema<string>();
  @type(['string']) nextEnemyItemClasses: ArraySchema<string> = new ArraySchema<string>();
  // Not synced from server — kept for potential future use
  availableItemCollections: ArraySchema<ItemCollection> = new ArraySchema<ItemCollection>();
}
