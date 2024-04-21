import { Schema, type, ArraySchema } from "@colyseus/schema";
import { Player } from "./PlayerSchema";




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



