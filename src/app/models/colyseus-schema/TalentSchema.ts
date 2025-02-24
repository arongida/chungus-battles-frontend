import { Schema, type, ArraySchema } from '@colyseus/schema';
import { AffectedStats } from './AffectedStatsSchema';

export class Talent extends Schema {
  @type('number') talentId: number = 0;
  @type('string') name: string = '';
  @type('string') description: string = '';
  @type('number') levelRequirement: number = 0;
  @type('number') activationRate: number = 0.5;
  @type('number') base: number = 0;
  @type('number') scaling: number = 0;
  @type('string') image?: string = '';
  @type('boolean') showDetails?: boolean = false;
  @type('string') imageCache?: string = '';
  @type(['string']) tags: string[] = new Array<string>();
  @type(['string']) triggerTypes: ArraySchema<string> = new ArraySchema();
  @type(AffectedStats) affectedStats: AffectedStats = new AffectedStats();
  @type(AffectedStats) affectedEnemyStats: AffectedStats = new AffectedStats();
}
