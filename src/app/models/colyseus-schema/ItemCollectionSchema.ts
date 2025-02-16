import { Schema, type, ArraySchema } from '@colyseus/schema';

export class ItemCollection extends Schema {
  @type('number') itemCollectionId: number = 0;
  @type('string') name: string = 'name';
  @type('string') requirements: string = 'requirements';
  @type('string') effect: string = 'effect';
  @type('string') image: string = 'image';
  @type(['string']) tags: ArraySchema<string> = new ArraySchema<string>();
  @type('number') tier: number = 0;
  base?: number = 0;
  scaling?: number = 0;
  activationRate?: number = 0;
  savedValue: number = 0;
}
