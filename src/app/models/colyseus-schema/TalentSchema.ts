import { Schema, type, ArraySchema } from '@colyseus/schema';
import { AffectedStats } from './AffectedStatsSchema';

export class Talent extends Schema {
  // Fields in backend declaration order (required for skipHandshake)
  @type('number') talentId: number = 0;
  @type('string') name: string = '';
  @type('string') description: string = '';
  @type('number') tier: number = 0;
  @type('number') activationRate: number = 0.5;
  @type('number') base: number = 0;
  @type('number') scaling: number = 0;
  @type('string') image: string = '';
  @type(['string']) tags: ArraySchema<string> = new ArraySchema();
  @type('string') triggerType: string = '';
  @type(['string']) triggerTypes: ArraySchema<string> = new ArraySchema();
  @type(AffectedStats) affectedStats: AffectedStats = new AffectedStats();
  @type(AffectedStats) affectedEnemyStats: AffectedStats = new AffectedStats();
  @type('number') statActivations: number = 0;
  @type('number') statDamageDealt: number = 0;
  @type('number') statHealingDone: number = 0;
  @type('number') statGoldGained: number = 0;
  @type('number') statXpGained: number = 0;
  @type('number') totalActivations: number = 0;
  @type('number') totalDamageDealt: number = 0;
  @type('number') totalHealingDone: number = 0;
  @type('number') totalGoldGained: number = 0;
  @type('number') totalXpGained: number = 0;
  // Frontend-only display state — not synced, must stay after all backend fields
  levelRequirement: number = 0;
  showDetails: boolean = false;
}
