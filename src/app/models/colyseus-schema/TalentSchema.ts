import { Schema, type } from '@colyseus/schema';

export class Talent extends Schema {
  @type('number') talentId: number = 0;
  @type('string') name: string = '';
  @type('string') description: string = '';
  @type('number') levelRequirement: number = 0;
  @type('number') activationRate: number = 0.5;
  @type('string') image?: string = '';
  @type('boolean') showDetails?: boolean = false;
  @type('string') imageCache?: string = '';
  @type(['string']) tags: string[] = new Array<string>();
  @type('string') triggerType: string = '';
}
