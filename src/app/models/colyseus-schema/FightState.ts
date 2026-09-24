import { Schema, type } from '@colyseus/schema';
import { Player } from './PlayerSchema';

export class FightState extends Schema {
  @type(Player) player: Player = new Player();
  @type(Player) enemy: Player = new Player();
  @type('number') timeScale: number = 1;
  @type('number') endBurnCountdownMs: number = 65000;
  @type('boolean') endBurnActive: boolean = false;
  @type('number') endBurnDamage: number = 10;
  // JSON-encoded OwnerProfile (common/social/owner-profile.ts) of the enemy snapshot's owner;
  // '' for Joe.
  @type('string') enemyOwnerJson: string = '';
}
