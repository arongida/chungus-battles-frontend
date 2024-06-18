import { Schema, type, ArraySchema } from '@colyseus/schema';
import { Talent } from './TalentSchema';
import { Item } from './ItemSchema';

export class Player extends Schema {
  @type('number') playerId: number = 0;
  @type('string') name: string = 'name';
  @type('number') hp: number = 0;
  @type('number') attack: number = 0;
  @type('number') gold: number = 0;
  @type('number') xp: number = 0;
  @type('number') level: number = 0;
  @type('string') sessionId: string = 'sessionId';
  @type('number') private _defense: number = 0;
  @type('number') attackSpeed: number = 0;
  @type('number') maxXp: number = 0;
  @type('number') round: number = 1;
  @type('number') lives: number = 3;
  @type('number') wins: number = 0;
  @type('string') avatarUrl: string =
    'https://chungus-battles.b-cdn.net/chungus-battles-assets/Portrait_ID_0_Placeholder.png';
  @type([Talent]) talents: ArraySchema<Talent> = new ArraySchema<Talent>();
  @type([Item]) inventory: ArraySchema<Item> = new ArraySchema<Item>();

  get defense(): number {
    return this._defense;
  }

  set defense(value: number) {
    this._defense = value;
  }
}
