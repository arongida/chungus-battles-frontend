import {
  ArraySchema,
  Schema,
  type,
} from '@colyseus/schema';
import { Player } from './PlayerSchema';
import { Item } from './ItemSchema';
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
  @type([ItemCollection]) availableItemCollections: ArraySchema<ItemCollection> = new ArraySchema<ItemCollection>();
  @type([Item]) questItems: ArraySchema<Item> = new ArraySchema<Item>();
}
