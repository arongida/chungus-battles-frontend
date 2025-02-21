import { Schema, type, SetSchema } from '@colyseus/schema';
import { AffectedStats } from './AffectedStatsSchema';

export class Item extends Schema {
  @type('number') itemId: number = 0;
  @type('string') name: string = '';
  @type('string') description: string = '';
  @type('number') price: number = 0;
  @type(AffectedStats) affectedStats: AffectedStats = new AffectedStats();
  @type('number') tier: number = 0;
  @type('string') image: string = '';
  @type('string') imageCache?: string = this.image;
  @type(['string']) tags: string[] = new Array<string>();
  @type('boolean') sold: boolean = false;
  @type('boolean') equipped: boolean = false;
  @type(['number']) itemCollections: number[] = [];
  @type('string') type: string = '';
  @type(['string']) equipOptions: SetSchema<string> = new SetSchema();
  showDetails: boolean = false;
}
