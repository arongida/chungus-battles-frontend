import { Component, Input } from '@angular/core';
import { NgIf } from '@angular/common';
import { Player } from '../../../models/colyseus-schema/PlayerSchema';
import { CombatLogEntry } from '../../../models/types/CombatLogEntry';

@Component({
  selector: 'app-combat-log-card',
  standalone: true,
  templateUrl: './combat-log-card.component.html',
  styleUrl: './combat-log-card.component.scss',
})
export class CombatLogCardComponent {
  @Input({ required: true }) entry!: CombatLogEntry;
  @Input({ required: true }) player!: Player;
  @Input({ required: true }) enemy!: Player;

  getName(id?: number): string {
    if (id === undefined) return '—';
    if (id === this.player?.playerId) return this.player.name;
    if (id === this.enemy?.playerId) return this.enemy.name;
    return `#${id}`;
  }

  getWeaponName(): string {
    const p = this.getPlayerById(this.entry.attackerId);
    if (!p) return '—';
    let found = '—';
    p.equippedItems.forEach(item => {
      if (item.itemId === this.entry.weaponItemId) found = item.name;
    });
    return found;
  }

  getTalentName(): string {
    if (!this.entry.talentId) return '—';
    for (const p of [this.player, this.enemy]) {
      const t = p?.talents?.find(t => t.talentId === this.entry.talentId);
      if (t) return t.name;
    }
    return `#${this.entry.talentId}`;
  }

  getItemName(): string {
    if (!this.entry.itemId) return '—';
    for (const p of [this.player, this.enemy]) {
      let found = '';
      p?.inventory?.forEach(item => { if (item.itemId === this.entry.itemId) found = item.name; });
      if (found) return found;
      p?.equippedItems?.forEach(item => { if (item.itemId === this.entry.itemId) found = item.name; });
      if (found) return found;
    }
    return `#${this.entry.itemId}`;
  }

  private getPlayerById(id?: number): Player | null {
    if (id === this.player?.playerId) return this.player;
    if (id === this.enemy?.playerId) return this.enemy;
    return null;
  }

  get kindLabel(): { icon: string; label: string } {
    switch (this.entry.kind) {
      case 'attack':        return { icon: '⚔️', label: 'Weapon Hit' };
      case 'dodge':         return { icon: '🦵', label: 'Dodge' };
      case 'talent':        return { icon: '⭐', label: 'Talent' };
      case 'item':          return { icon: '🎒', label: 'Item' };
      case 'heal':          return { icon: '💚', label: 'Heal' };
      case 'leech':         return { icon: '🩸', label: 'Leech' };
      case 'regen':         return { icon: '🧪', label: 'Regen' };
      case 'poison_tick':   return { icon: '☠️', label: 'Poison Tick' };
      case 'poison_apply':  return { icon: '🐍', label: 'Poisoned' };
      case 'reward':        return { icon: '💰', label: 'Reward' };
      case 'result':        return { icon: '🏆', label: 'Result' };
      case 'end_burn':      return { icon: '🔥', label: 'End Burn' };
      default:              return { icon: '📜', label: 'Event' };
    }
  }

  fmt(n?: number): string {
    if (n === undefined || n === null) return '—';
    return parseFloat(n.toFixed(2)).toString();
  }
}
