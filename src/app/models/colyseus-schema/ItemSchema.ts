import { Schema, type } from '@colyseus/schema';

export class AffectedStats extends Schema {
  @type('number') hp: number = 0;
  @type('number') attack: number = 0;
  @type('number') defense: number = 0;
  @type('number') attackSpeed: number = 0;
}
export class Item extends Schema {
  @type('number') itemId: number = 0;
  @type('string') name: string = '';
  @type('string') description: string = '';
  @type('number') price: number = 0;
  @type('string') affectedStat: string = '';
  @type(AffectedStats) affectedStats: AffectedStats = new AffectedStats();
  @type('number') levelRequirement: number = 0;
  @type('string') image: string = '';
  @type('boolean') showDetails?: boolean = false;
  @type('string') imageCache?: string = '';
  @type(['string']) tags: string[] = new Array<string>();
}
