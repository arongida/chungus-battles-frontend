import {
  Schema,
  type,
  SetSchema,
  ArraySchema,
} from '@colyseus/schema';
import { AffectedStats } from './AffectedStatsSchema';

class Item extends Schema {
  // Fields in backend declaration order (required for skipHandshake)
  @type('number') itemId: number = 0;
  @type('string') name: string = '';
  @type('string') description: string = '';
  @type('number') price: number = 0;
  @type('number') sellPrice: number = 0;
  @type(AffectedStats) affectedStats: AffectedStats = new AffectedStats();
  @type(AffectedStats) setBonusStats: AffectedStats = new AffectedStats();
  @type('boolean') setActive: boolean = false;
  @type('number') tier: number = 0;
  @type('number') rarity: number = 1;
  @type('string') image: string = '';
  @type(['string']) tags: ArraySchema<string> = new ArraySchema();
  @type('boolean') sold: boolean = false;
  @type('boolean') equipped: boolean = false;
  @type(['number']) itemCollections: ArraySchema<number> = new ArraySchema();
  @type('string') type: string = '';
  @type('string') set: string = '';
  @type(['string']) equipOptions: SetSchema<string> = new SetSchema();
  @type('boolean') showDetails: boolean = false;
  @type('number') baseMinDamage: number = 0;
  @type('number') baseMaxDamage: number = 0;
  @type('number') baseAttackSpeed: number = 0;
  @type(['string']) triggerTypes: ArraySchema<string> = new ArraySchema<string>();
  @type(AffectedStats) affectedEnemyStats: AffectedStats = new AffectedStats();
  // Frontend-only display state — not synced, must stay after all backend fields
  imageCache: string = '';
}

export default Item;
