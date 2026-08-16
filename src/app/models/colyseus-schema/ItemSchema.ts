import {
  Schema,
  type,
  SetSchema,
  ArraySchema,
} from '@colyseus/schema';
import { AffectedStats } from './AffectedStatsSchema';

// Mirrors ItemRollPreview from the backend's src/items/stats/itemRollPreview.ts.
// Only present on items fetched from the /items catalog endpoint (encyclopedia);
// items synced via Colyseus state never carry it.
export interface NumberRange {
  min: number;
  max: number;
}

export interface PossibleStatRange extends NumberRange {
  stat: string;
}

export interface ItemRollPreview {
  affixCount: number;
  possibleStats: PossibleStatRange[];
  weaponBase?: {
    minDamage: NumberRange;
    maxDamage: NumberRange;
    attackSpeed: NumberRange;
  };
}

class Item extends Schema {
  // Fields in backend declaration order (required for skipHandshake)
  @type('number') itemId: number = 0;
  @type('string') name: string = '';
  @type('string') description: string = '';
  @type('number') price: number = 0;
  @type('number') sellPrice: number = 0;
  @type(AffectedStats) affectedStats: AffectedStats = new AffectedStats();
  @type('number') tier: number = 0;
  @type('number') rarity: number = 1;
  @type('string') image: string = '';
  @type(['string']) tags: ArraySchema<string> = new ArraySchema();
  @type('boolean') sold: boolean = false;
  @type('boolean') equipped: boolean = false;
  @type(['number']) itemCollections: ArraySchema<number> = new ArraySchema();
  @type('string') type: string = '';
  @type('string') class: string = '';
  @type(['string']) equipOptions: SetSchema<string> = new SetSchema();
  @type('boolean') showDetails: boolean = false;
  @type('number') baseMinDamage: number = 0;
  @type('number') baseMaxDamage: number = 0;
  @type('number') baseAttackSpeed: number = 0;
  @type('number') strengthScaling: number = 1;
  @type(['string']) triggerTypes: ArraySchema<string> = new ArraySchema<string>();
  // Activations per second for TriggerType.ACTIVE items (Wand of Fire, Flowering Staff, Magic
  // Ring) — same meaning as Talent.activationRate. 0 for every non-active item.
  @type('number') activationRate: number = 0;
  @type(AffectedStats) affectedEnemyStats: AffectedStats = new AffectedStats();
  @type('boolean') upgradePreview: boolean = false;
  // True for shop slots that rolled a lucky-find rarity-up (see applyLuckyShopUpgrades).
  @type('boolean') luckyFind: boolean = false;
  // Rarity of the owned item this preview was built from — 0 when not a preview.
  @type('number') previewBaseRarity: number = 0;
  // Free rarity steps this slot rolled via applyLuckyShopUpgrades.
  @type('number') luckyFindSteps: number = 0;
  // Class-item skill (rolled at Legendary, restated at Mythic — see backend
  // items/skills/itemSkillRoller.ts). 0/empty when no skill has been granted.
  @type('number') skillId: number = 0;
  @type('string') skillName: string = '';
  @type('string') skillDescription: string = '';
  // Dynamic skill output only, never persisted — mirrors item.affectedStats but driven by the
  // skill's own behavior (see backend ItemSkillBehaviors.ts). Not typically read directly by the
  // frontend (the final combined stat already shows via character stats), kept for parity with
  // the backend schema's field order.
  @type(AffectedStats) skillAffectedStats: AffectedStats = new AffectedStats();
  @type(AffectedStats) skillAffectedEnemyStats: AffectedStats = new AffectedStats();
  // Live, per-tick skill state as display text (e.g. "+42 / +100 defense"), EQUIPPED items only —
  // mirrors backend ItemSchema.ts's skillStatus. Never present via the /playerBuild REST path.
  @type('string') skillStatus: string = '';
  // Second item skill — only ever granted by Weapon Whisperer (backend TalentBehaviors.ts).
  // Same shape/lifecycle as skillId/skillName/skillDescription/skillAffectedStats/
  // skillAffectedEnemyStats/skillStatus above; 0/empty for every other item.
  @type('number') skillId2: number = 0;
  @type('string') skillName2: string = '';
  @type('string') skillDescription2: string = '';
  @type(AffectedStats) skillAffectedStats2: AffectedStats = new AffectedStats();
  @type(AffectedStats) skillAffectedEnemyStats2: AffectedStats = new AffectedStats();
  @type('string') skillStatus2: string = '';
  // The skill this class item WILL roll once it reaches Legendary — a precomputed promise, not a
  // guess (see backend items/skills/itemSkillRoller.ts's refreshFutureItemSkill). 0/empty once a
  // real skillId is granted, for shields, and for non-class items.
  @type('number') futureSkillId: number = 0;
  @type('string') futureSkillName: string = '';
  @type('string') futureSkillDescription: string = '';
  // Runtime-only max-damage bonus accumulated during a fight (Soulstealer's Scythe souls) —
  // mirrors backend ItemSchema.ts's bonusMaxDamage. Not persisted, always 0 outside a fight.
  @type('number') bonusMaxDamage: number = 0;
  // Frontend-only display state — not synced, must stay after all backend fields
  imageCache: string = '';
  rollPreview: ItemRollPreview | null = null;
}

export default Item;
