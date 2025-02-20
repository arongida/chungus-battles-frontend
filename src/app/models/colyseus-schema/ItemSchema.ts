import { Schema, type } from '@colyseus/schema';
import { AffectedStats } from './AffectedStatsSchema';

export class Item extends Schema {
  @type('number') itemId: number = 0;
  @type('string') name: string = '';
  @type('string') description: string = '';
  @type('number') price: number = 0;
  @type(AffectedStats) affectedStats: AffectedStats = new AffectedStats();
  @type('number') tier: number = 0;
  @type('string') image: string = '';
  @type('boolean') showDetails?: boolean = false;
  @type('string') imageCache?: string = this.image;
  @type(['string']) tags: string[] = new Array<string>();
  @type('boolean') sold: boolean = false;
  @type('boolean') equipped: boolean = false;
  @type(['number']) itemCollections: number[] = [];
  @type('string') type: string = '';
}
