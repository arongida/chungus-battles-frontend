import { ArraySchema, MapSchema } from '@colyseus/schema';
import { Player } from '../../models/colyseus-schema/PlayerSchema';
import Item from '../../models/colyseus-schema/ItemSchema';
import { Talent } from '../../models/colyseus-schema/TalentSchema';
import { AffectedStats } from '../../models/colyseus-schema/AffectedStatsSchema';

export function buildItemFromData(itemData: any): Item {
  const { affectedStats, affectedEnemyStats, triggerTypes, tags, ...primitives } = itemData;
  const item = new Item();
  const primitiveFields = ['itemId', 'name', 'description', 'price', 'sellPrice',
    'tier', 'rarity', 'image', 'sold', 'equipped', 'type', 'class', 'showDetails',
    'baseMinDamage', 'baseMaxDamage', 'baseAttackSpeed'];
  primitiveFields.forEach(f => { if (primitives[f] !== undefined) try { (item as any)[f] = primitives[f]; } catch {} });
  if (affectedStats) { const s = new AffectedStats(); Object.assign(s, affectedStats); item.affectedStats = s; }
  if (affectedEnemyStats) { const s = new AffectedStats(); Object.assign(s, affectedEnemyStats); item.affectedEnemyStats = s; }
  if (triggerTypes?.length) item.triggerTypes = new ArraySchema<string>(...triggerTypes);
  if (tags?.length) item.tags = new ArraySchema<string>(...tags);
  if (primitives.rollPreview) item.rollPreview = primitives.rollPreview;
  return item;
}

export function buildPlayerFromData(data: any): Player {
  const player = new Player();
  const primitiveFields = ['playerId', 'originalPlayerId', 'name', 'gold', 'xp', 'level',
    'sessionId', 'maxXp', 'round', 'lives', 'wins', 'avatarUrl', 'gameVersion',
    'income', 'hpRegen', 'dodgeRate', 'refreshShopCost', 'maxHp', 'hp',
    'strength', 'accuracy', 'defense', 'attackSpeed', 'flatDmgReduction', 'comradeFreeClaim', 'goldGenieFreeClaim'];
  primitiveFields.forEach(f => { if (data[f] !== undefined) try { (player as any)[f] = data[f]; } catch {} });
  if (data.baseStats) Object.assign(player.baseStats, data.baseStats);
  const equippedMap = new MapSchema<Item>();
  if (data.equippedItems) {
    Object.entries(data.equippedItems).forEach(([slot, itemData]) => {
      equippedMap.set(slot, buildItemFromData(itemData as any));
    });
  }
  player.equippedItems = equippedMap;
  const talentsSchema = new ArraySchema<Talent>();
  (data.talents || []).forEach((t: any) => {
    const { affectedStats, affectedEnemyStats, triggerTypes, tags, ...primitives } = t;
    const talent = new Talent();
    Object.keys(primitives).forEach(f => { try { (talent as any)[f] = primitives[f]; } catch {} });
    if (affectedStats) Object.assign(talent.affectedStats, affectedStats);
    if (affectedEnemyStats) Object.assign(talent.affectedEnemyStats, affectedEnemyStats);
    if (triggerTypes?.length) talent.triggerTypes = new ArraySchema<string>(...triggerTypes);
    if (tags?.length) talent.tags = new ArraySchema<string>(...tags);
    talentsSchema.push(talent);
  });
  player.talents = talentsSchema;
  const inventorySchema = new ArraySchema<Item>();
  (data.inventory || []).forEach((itemData: any) => inventorySchema.push(buildItemFromData(itemData)));
  player.inventory = inventorySchema;
  calculatePlayerStats(player);
  return player;
}

function calculatePlayerStats(player: Player): void {
  const b = player.baseStats;
  player.strength        = b.strength        ?? 0;
  player.accuracy        = b.accuracy        ?? 0;
  player.maxHp           = b.maxHp           ?? 100;
  player.defense         = b.defense         ?? 0;
  player.dodgeRate       = b.dodgeRate       ?? 0;
  player.flatDmgReduction = b.flatDmgReduction ?? 0;
  player.income          = b.income          ?? 0;
  player.hpRegen         = b.hpRegen         ?? 0;
  let speedMult          = b.attackSpeed      ?? 1;

  const addStats = (src: AffectedStats) => {
    player.strength         += src.strength         ?? 0;
    player.accuracy         += src.accuracy         ?? 0;
    player.maxHp            += src.maxHp            ?? 0;
    player.defense          += src.defense          ?? 0;
    player.dodgeRate        += src.dodgeRate        ?? 0;
    player.flatDmgReduction += src.flatDmgReduction ?? 0;
    player.income           += src.income           ?? 0;
    player.hpRegen          += src.hpRegen          ?? 0;
    const spd = src.attackSpeed;
    if (spd && spd !== 0 && spd !== 1) speedMult += spd - 1;
  };

  player.equippedItems.forEach(item => {
    if (item.affectedStats) addStats(item.affectedStats);
  });

  player.talents.forEach(talent => {
    if (talent.affectedStats) addStats(talent.affectedStats);
  });

  player.attackSpeed = speedMult;
  player.hp = player.maxHp;
}
