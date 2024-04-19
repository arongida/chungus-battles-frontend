import { Schema, type, ArraySchema } from "@colyseus/schema";


export class Player extends Schema {
  @type("number") playerId: number = 0;
  @type("string") name: string = "name";
  @type("number") hp: number = 0;
  @type("number") attack: number = 0;
  @type("number") gold: number = 0;
  @type("number") xp: number = 0;
  @type("number") level: number = 0;
  @type("string") sessionId: string = "sessionId";
  @type("number") defense: number = 0;
  @type("number") attackSpeed: number = 0;
  @type("number") maxXp: number = 0;
}

export class Item extends Schema {
  @type("number") itemId: number = 0;
  @type("string") name: string = "item name";
  @type("string") description: string = "item description";
  @type("number") price: number = 0;
  @type("string") affectedStat: string = "affected stat";
  @type("number") affectedValue: number = 0;
}



export class DraftState extends Schema {
  @type(Player) player: Player = new Player();
  @type([Item]) shop: ArraySchema<Item> = new ArraySchema<Item>();
  @type("number") shopSize: number = 3;
}



