import { Component, inject, input, Input, OnInit, PLATFORM_ID, signal } from '@angular/core';
import {
  Player,
} from '../../../models/colyseus-schema/PlayerSchema';
import {
  DecimalPipe,
  isPlatformBrowser,
  NgClass,
  TitleCasePipe,
} from '@angular/common';
import {
  MatProgressBarModule,
} from '@angular/material/progress-bar';
import Item from '../../../models/colyseus-schema/ItemSchema';
import {
  ItemHoverCardDirective,
} from '../../directives/item-hover-card.directive';
import {
  DraftService,
} from '../../../draft/services/draft.service';
import { MatButtonModule } from '@angular/material/button';
import {
  EquipSlot, ItemRarity,
} from '../../../models/types/ItemTypes';
import { InfoHintDirective } from '../../directives/info-hint.directive';
import { InfoHoverCardDirective } from '../../directives/info-hover-card.directive';
import { InfoContent } from '../../models/info-content';
import { SkillIconsComponent } from '../skill-icons/skill-icons.component';
import { CharacterDetailsService } from '../../services/character-details.service';
import { InfoBoxService } from '../../services/info-box.service';
import { PanelLayoutService } from '../../services/panel-layout.service';


@Component({
  selector: 'app-character-details',
  standalone: true,
  imports: [
    MatProgressBarModule,
    DecimalPipe,
    NgClass,
    MatButtonModule,
    ItemHoverCardDirective,
    TitleCasePipe,
    InfoHintDirective,
    InfoHoverCardDirective,
    SkillIconsComponent,
  ],
  templateUrl: './character-details.component.html',
  styleUrl: './character-details.component.scss',
})
export class CharacterDetailsComponent implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly infoBoxService = inject(InfoBoxService);
  private readonly panelLayoutService = inject(PanelLayoutService);

  @Input({ required: true }) player: Player = new Player();
  @Input() enemy: boolean = false;
  @Input() combat: boolean = false;
  @Input() showStats: boolean = true;
  /** When set, the minimized/maximized state below is persisted under this key
   *  (via PanelLayoutService) so it survives across fights and reloads. */
  @Input() panelId?: string;
  playerBeingHit = input(false);
  enemyBeingHit = input(false);

  /** Compact ↔ detailed toggle. Default: detailed in battle on desktop, compact otherwise. */
  expanded = signal(false);
  expand(): void {
    this.expanded.set(true);
    this.characterDetailsService.acknowledgePurchase();
    if (this.panelId) this.panelLayoutService.setExpanded(this.panelId, true);
  }
  collapse(): void {
    this.expanded.set(false);
    if (this.panelId) this.panelLayoutService.setExpanded(this.panelId, false);
  }
  toggleExpanded(): void {
    this.expanded() ? this.collapse() : this.expand();
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Prefer a previously saved minimized/maximized state for this panel; otherwise fall
      // back to the width-based default: detailed on desktop (≥640 px), compact on mobile.
      const saved = this.panelId ? this.panelLayoutService.getExpanded(this.panelId) : undefined;
      this.expanded.set(saved ?? window.innerWidth >= 640);
    }
  }

  /**
   * Returns the "_transparent" portrait variant used in compact view.
   * Mirrors the transform already used in the draft toolbar:
   *   warrior_01.png → warrior_transparent.png
   * Placeholders that lack "01" pass through unchanged.
   */
  getCompactAvatarImage(): string {
    return (this.player?.avatarUrl ?? 'assets/Portrait_ID_0_Placeholder.png')
      .replace('01', 'transparent');
  }

  equipmentLayout = [
    [EquipSlot.HELMET, EquipSlot.MAIN_HAND, EquipSlot.OFF_HAND, EquipSlot.ARMOR],
  ];

  readonly slotIcons: Record<string, string> = {
    [EquipSlot.HELMET]:    '🪖',
    [EquipSlot.MAIN_HAND]: '⚔️',
    [EquipSlot.OFF_HAND]:  '🛡️',
    [EquipSlot.ARMOR]:     '🧥',
  };

  readonly inventoryCategories = [
    { label: 'All',     value: 'all' },
    { label: 'Helmets', value: 'helmet' },
    { label: 'Weapons', value: 'weapon' },
    { label: 'Armors',  value: 'armor' },
    { label: 'Shields', value: 'shield' },
  ];

  selectedCategory = 'all';

  constructor(
    public draftService: DraftService,
    public characterDetailsService: CharacterDetailsService,
  ) { }

  getNormalAvatarImage(): string {
    let avatar = this.player?.avatarUrl || 'assets/Portrait_ID_0_Placeholder.png';
    if (this.enemy) {
      avatar = avatar.replace('.png', '_enemy.png');
    }
    return avatar;
  }

  getCringeAvatarImage(): string {
    let avatar = this.player?.avatarUrl || 'assets/Portrait_ID_0_Placeholder.png';
    avatar = avatar.replace('.png', '_cringe.png');
    if (this.enemy) {
      avatar = avatar.replace('.png', '_enemy.png');
    }
    return avatar;
  }

  isShowingCringe(): boolean {
    return (this.enemy && this.enemyBeingHit()) || this.playerBeingHit();
  }

  getPlayerHp(): number {
    return this.player.hp > 0 && this.player.hp < 1 ? 1 : this.player.hp;
  }

  getInventoryFiltered() {
    if (this.selectedCategory === 'all') {
      return this.player.inventory;
    }
    return this.player.inventory.filter(item => item.type === this.selectedCategory);
  }

  sellSelectedItem(item: Item) {
    if (!this.infoBoxService.gateAction(this.sellHint)) return;
    this.draftService.sendMessage('sell', {
      itemId: item.itemId,
    });
  }

  undoSell(): void {
    if (!this.infoBoxService.gateAction(this.undoSellHint)) return;
    this.draftService.sendMessage('undo_sell', {});
  }

  equip(item: Item, slot: EquipSlot | string) {
    if (!this.infoBoxService.gateAction(this.equipHint)) return;
    this.draftService.sendMessage('equip', {
      itemId: item.itemId,
      slot: slot,
    });
  }

  unequip(item: Item | undefined, slot: EquipSlot) {
    if (!item) return;
    this.draftService.sendMessage('unequip', {
      itemId: item.itemId,
      slot: slot,
    });
  }

  /** Desktop only: clicking a filled slot unequips directly. On touch, the item card's
   *  Unequip button (surfaced via appItemHoverCard) drives this instead — see template. */
  onEquippedSlotClick(item: Item | undefined, slot: EquipSlot): void {
    if (this.infoBoxService.isTouch) return;
    this.unequip(item, slot);
  }

  getRarityBorder(rarity: ItemRarity | string): string {
    switch (rarity) {
      case ItemRarity.RARE: return '3px solid #60a5fa';
      case ItemRarity.EPIC: return '3px solid #c084fc';
      case ItemRarity.LEGENDARY: return '3px solid #fb923c';
      case ItemRarity.MYTHIC: return '3px solid #d11512ff';
      default: return '3px solid #92400e';
    }
  }

  getItemAtSlot(slot: EquipSlot) {
    return this.player.equippedItems.get(slot);
  }

  triggerSlotActivation(slot: string): void {
    const el = document.getElementById(`equipped-slot-${slot}-${this.player.playerId}`);
    if (!el) return;

    el.classList.add('slot-activated');
    el.classList.remove('slot-pulse');
    void el.offsetWidth;
    el.classList.add('slot-pulse');

    setTimeout(() => el.classList.remove('slot-pulse'), 350);
  }

  deactivateSlot(slot: string): void {
    const el = document.getElementById(`equipped-slot-${slot}-${this.player.playerId}`);
    el?.classList.remove('slot-activated');
  }

  protected readonly ItemRarity = ItemRarity;

  readonly equipHint: InfoContent = {
    id: 'equip-item',
    title: 'Equip Item',
    entries: [
      { icon: '🗡️', label: 'Equip', text: 'Place this item into an equipment slot. Equipped items provide their stats during battle.' },
      { icon: '↩️', label: 'Unequip', text: 'Select an equipped item in the slots above and press Unequip to return it to your inventory.' },
    ],
  };

  readonly sellHint: InfoContent = {
    id: 'sell-item',
    title: 'Sell Item',
    entries: [
      { icon: '🟡', label: 'Sell for Gold', text: 'Sell this item for 70% of its base price. Sold by mistake? Use the "Undo sell" button that appears above your inventory to get it back.' },
    ],
  };

  readonly undoSellHint: InfoContent = {
    id: 'undo-sell',
    title: 'Undo Sell',
    entries: [
      { icon: '↩️', label: 'Undo', text: 'Returns the most recently sold item to your inventory and refunds the gold you got for it. Only the last sale can be undone.' },
    ],
  };

  get allStatsHint(): InfoContent {
    const dodgeChance = Math.round(100 * (1 - 100 / (100 + this.player.dodgeRate)));
    const defenseReduction = Math.round(100 * (1 - 100 / (100 + this.player.defense)));
    return {
      id: 'all-stats',
      title: `${this.player.name}'s Stats`,
      entries: [
        { icon: '❤️', label: 'Health', text: `${Math.round(this.player.maxHp)} HP total. Reaches zero = you lose the battle.`, color: 'text-pink-500' },
        { icon: '🎯', label: 'Accuracy', text: `+${this.player.accuracy?.toFixed(1)} added to your weapon's minimum damage roll.`, color: 'text-red-400' },
        { icon: '⚔️', label: 'Strength', text: `+${this.player.strength?.toFixed(1)} added to your weapon's maximum damage roll.`, color: 'text-red-400' },
        { icon: '⏩', label: 'Speed Bonus', text: `${((this.player.attackSpeed - 1) * 100)?.toFixed(0)}% multiplier applied to all weapon attack speeds.`, color: 'text-blue-400' },
        { icon: '💰', label: 'Income', text: `${this.player.income} gold earned at the end of this fight. Grows by 1 each fight.`, color: 'text-yellow-400' },
        { icon: '🧪', label: 'HP Regen', text: `Recover ${this.player.hpRegen?.toFixed(3)} HP every second during battle.`, color: 'text-orange-400' },
        { icon: '🔰', label: 'Flat Damage Reduction', text: `Reduces all incoming damage by ${this.player.flatDmgReduction?.toFixed(3)} flat.`, color: 'text-green-400' },
        { icon: '🛡️', label: 'Defense', text: `Reduces incoming damage by ${defenseReduction}% (DR formula applied to ${this.player.defense?.toFixed(2)} defense).`, color: 'text-green-400' },
        { icon: '🦵', label: 'Dodge', text: `${dodgeChance}% chance to completely dodge an incoming attack.`, color: 'text-green-400' },
      ],
    };
  }
}
