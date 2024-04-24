import { Schema, type } from "@colyseus/schema";

export class Item extends Schema {
  @type("number") itemId: number = 0;
  @type("string") name: string = '';
  @type("string") description: string = '';
  @type("number") price: number = 0;
  @type("string") affectedStat: string = '';
  @type("number") affectedValue: number = 0;
}