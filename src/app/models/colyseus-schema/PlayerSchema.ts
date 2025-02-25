import {
  ArraySchema,
  MapSchema,
  Schema,
  type,
} from '@colyseus/schema';
import { Talent } from './TalentSchema';
import { Item } from './ItemSchema';
import { ItemCollection } from './ItemCollectionSchema';
import { ItemRarity } from '../types/ItemTypes';

export class Player extends Schema {
  @type('number') playerId: number = 0;
  @type('string') name: string = 'name';
  @type('number') private _hp: number = 0;
  @type('number') private _strength: number = 0;
  @type('number') private _accuracy: number = 0;
  @type('number') private _gold: number = 0;
  @type('number') xp: number = 0;
  @type('number') private _level: number = 0;
  @type('string') sessionId: string = 'sessionId';
  @type('number') private _defense: number = 0;
  @type('number') private _attackSpeed: number = 0;
  @type('number') maxXp: number = 0;
  @type('number') round: number = 1;
  @type('number') lives: number = 3;
  @type('number') wins: number = 0;
  @type('number') private _poisonStack: number = 0;
  @type('string') avatarUrl: string =
    'https://chungus-battles.b-cdn.net/chungus-battles-assets/Portrait_ID_0_Placeholder.png';
  @type([Talent]) talents: ArraySchema<Talent> = new ArraySchema<Talent>();
  @type([Item]) inventory: ArraySchema<Item> = new ArraySchema<Item>();
  @type([Item]) lockedShop: ArraySchema<Item> = new ArraySchema<Item>();
  @type({ map: Item }) equippedItems = new MapSchema<Item>();
  @type([ItemCollection]) activeItemCollections: ArraySchema<ItemCollection> =
    new ArraySchema<ItemCollection>();
  @type([ItemCollection])
  availableItemCollections: ArraySchema<ItemCollection> =
    new ArraySchema<ItemCollection>();
  @type('number') dodgeRate: number = 0;
  @type('number') income: number = 0;
  @type('number') hpRegen: number = 0;
  @type('number') refreshShopCost: number = 2;
  @type('number') maxHp: number = 0;
  @type('number') flatDmgReduction: number = 0;

  get gold(): number {
    return this._gold;
  }

  set gold(value: number) {
    this._gold = value < 0 ? 0 : value;
  }

  get level(): number {
    return this._level;
  }

  set level(value: number) {
    this._level = value > 5 ? 5 : value;
  }

  get attackSpeed(): number {
    return this._attackSpeed;
  }

  set attackSpeed(value: number) {
    this._attackSpeed = value < 0.1 ? 0.1 : value;
  }

  get hp(): number {
    return this._hp;
  }

  set hp(value: number) {
    this._hp = value < 0 ? 0 : value;
  }

  get strength(): number {
    return this._strength;
  }

  set strength(value: number) {
    this._strength = value < 1 ? 1 : value;
  }

  get accuracy(): number {
    return this._accuracy;
  }

  set accuracy(value: number) {
    this._accuracy = value < 1 ? 1 : value;
  }

  get poisonStack(): number {
    return this._poisonStack;
  }

  set poisonStack(value: number) {
    if (value < 0) {
      this._poisonStack = 0;
    } else if (value > 50) {
      this._poisonStack = 50;
    } else {
      this._poisonStack = value;
    }
  }

  get defense(): number {
    return this._defense;
  }

  set defense(value: number) {
    this._defense = value < 0 ? 0 : value;
  }

  // getItemcollectionItemCountFromEquip(collectionId: number): number {
  //   let counter = 0;
  //
  //   this.equippedItems.forEach((item) => {
  //     if (item.itemCollections.includes(collectionId)) {
  //       counter++;
  //     }
  //   });
  //
  //   return counter;
  // }

  getAllItems(): Item[] {
    const allItems = [...this.inventory];
    this.equippedItems.forEach((value) => {
      allItems.push(value);
    });
    return allItems;
  }

  // getItemcollectionItemCountTotal(collectionId: number): number {
  //   const allItems = this.inventory;
  //   if (allItems.length === 0) return 0;
  //   const itemsInSet = allItems.filter((item) => item.itemCollections.includes(collectionId));
  //   const setItemSet = new Set(itemsInSet.map((item) => item.itemId));
  //   return setItemSet.size;
  // }

  getOwnedCountForItem(item: Item): number {
    const allItems = this.getAllItems();
    let counter = 0;
    const sameItems = allItems.filter(filterItem => item.itemId === filterItem.itemId);
    sameItems.forEach(item => {
      if (item.rarity === ItemRarity.EPIC) counter += 4;
      else counter += item.rarity;
    });
    return counter;
  }

  setLockedShopToDefault(){
    this.lockedShop = new ArraySchema<Item>();
  }
}
