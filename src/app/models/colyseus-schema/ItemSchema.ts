import {
  Schema,
  type,
  SetSchema,
  ArraySchema,
} from '@colyseus/schema';
import { AffectedStats } from './AffectedStatsSchema';

class Item extends Schema {
  @type('number') itemId: number = 0;
  @type('string') name: string = '';
  @type('string') description: string = '';
  @type('number') price: number = 0;
  @type(AffectedStats) affectedStats: AffectedStats = new AffectedStats();
  @type(AffectedStats) setBonusStats: AffectedStats = new AffectedStats();
  @type('boolean') setActive: boolean = false;
  @type('number') tier: number = 0;
  @type('number') rarity: number = 1;
  @type('string') image: string = '';
  @type('string') imageCache?: string = this.image;
  @type(['string']) tags: string[] = new Array<string>();
  @type('boolean') sold: boolean = false;
  @type('boolean') equipped: boolean = false;
  @type('string') type: string = '';
  @type('string') set: string = '';
  @type(['string']) equipOptions: SetSchema<string> = new SetSchema();
  @type('boolean') showDetails: boolean = false;
  @type('number') baseMinDamage: number = 0;
  @type('number') baseMaxDamage: number = 0;
  @type('number') baseAttackSpeed: number = 0;
  @type(['string']) triggerTypes: ArraySchema<string> = new ArraySchema<string>();
}

export default Item;
