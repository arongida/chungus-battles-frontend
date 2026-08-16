import {Schema, type} from "@colyseus/schema";

export class AffectedStats extends Schema {
    @type('number') strength: number = 0;
    @type('number') accuracy: number = 0;
    @type('number') attackSpeed: number = 0;
    @type('number') maxHp: number = 0;
    @type('number') defense: number = 0;
    @type('number') dodgeRate: number = 0;
    @type('number') income: number = 0;
    @type('number') hpRegen: number = 0;
    @type('number') cooldownReduction: number = 0;
    // Shop-only bonus, never rolled on items — currently granted only by VIP Pass (talent 202).
    @type('number') luckyFindChance: number = 0;
}