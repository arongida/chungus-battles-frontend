import { Schema, type } from "@colyseus/schema";

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
  @type("number") round: number = 1;
}