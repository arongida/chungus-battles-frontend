import { EquipSlot } from '../../models/types/ItemTypes';

/** Wins needed to end a run as a victory. Mirrors WINS_TO_WIN on the backend (src/common/types.ts). */
export const WINS_TO_WIN = 12;

/** Game-time (ms) a fight can run before the escalating "end burn" AoE kicks in. Mirrors END_BURN_START_MS on the backend. */
export const END_BURN_START_MS = 65000;

/** Display order of equipment slots — the equipment panel, the equip buttons under each
 *  inventory row, and the comparison overlay all read from here so they stay in sync.
 *  equipOptions itself arrives in DB/backend order (mainHand, offHand, then armor+helmet
 *  appended by Martial Artist), which does not match this — see character-details.component.ts's
 *  orderedEquipOptions(). */
export const EQUIP_SLOT_DISPLAY_ORDER: EquipSlot[] = [EquipSlot.HELMET, EquipSlot.MAIN_HAND, EquipSlot.OFF_HAND, EquipSlot.ARMOR];
