import { Schema, type } from "@colyseus/schema";

export class Talent extends Schema {
  @type("number") talentId: number = 0;
  @type("string") name: string = '';
  @type("string") description: string = '';
  @type("number") levelRequirement: number = 0;
  @type("string") class: string = '';
  @type("number") level: number = 1;
  @type("number") activationRate: number = 0.5;
}