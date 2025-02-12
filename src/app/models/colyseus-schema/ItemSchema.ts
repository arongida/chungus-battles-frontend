import { Schema, type } from '@colyseus/schema';

export class AffectedStats extends Schema {
  @type('number') hp: number = 0;
  @type('number') attack: number = 0;
  @type('number') defense: number = 0;
  @type('number') dodgeRate: number = 0;
  @type('number') flatDmgReduction: number = 0;
  @type('number') attackSpeed: number = 0;
  @type('number') income: number = 0;
  @type('number') hpRegen: number = 0;

}
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
