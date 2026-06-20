import { Renderer2 } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DamageType } from '../models/types/MessageTypes';

export function triggerAvatarHit(playerId: number) {
  const el = document.getElementById(`avatar-${playerId}`);
  if (el) {
    el.classList.add('animate-avatar-hit');
    setTimeout(() => el.classList.remove('animate-avatar-hit'), 400);
  }
}

export function triggerTalentActivation(talentId: number, playerId: number) {
  const talentContainer = document.getElementById(
    `talent-${talentId}-${playerId}`
  );

  if (talentContainer) {
    talentContainer.classList.add('animate-talent');
    setTimeout(() => {
      talentContainer.classList.remove('animate-talent');
    }, 500);
  }
}

export function triggerItemActivation(playerId: number, slot: string) {
  const el = document.getElementById(`equipped-slot-${slot}-${playerId}`);
  if (el) {
    el.classList.add('animate-talent');
    setTimeout(() => el.classList.remove('animate-talent'), 500);
  }
}

export function triggerShowDamageNumber(renderer: Renderer2, platformId: Object, damage: number, defenderId: number, type: DamageType = 'normal'): void {
  if (!isPlatformBrowser(platformId)) return;
  const container = document.getElementById(`damage-numbers-${defenderId}`);
  if (!container) {
    console.warn(`Damage container not found for defenderId: ${defenderId}`);
    return;
  }
  const el = renderer.createElement('div');
  renderer.addClass(el, 'damage-number');
  if (type === 'poison' || type === 'burn') {
    renderer.addClass(el, `damage-number--${type}`);
  }
  renderer.appendChild(el, renderer.createText(`-${damage}`));
  renderer.setStyle(el, 'left', `${Math.random() * 100}%`);
  renderer.setStyle(el, 'fontSize', `${18 + damage * 0.5}px`);
  renderer.appendChild(container, el);
  setTimeout(() => { if (el.parentNode === container) renderer.removeChild(container, el); }, 3000);
}

export function triggerShowDodgeText(renderer: Renderer2, platformId: Object, defenderId: number): void {
  showFloatingText(renderer, platformId, defenderId, 'dodge-number', 'Dodge!');
}

export function triggerShowInvulnerableText(renderer: Renderer2, platformId: Object, playerId: number): void {
  showFloatingText(renderer, platformId, playerId, 'invulnerable-number', '🛡️ Invulnerable!');
}

function showFloatingText(renderer: Renderer2, platformId: Object, playerId: number, cssClass: string, text: string): void {
  if (!isPlatformBrowser(platformId)) return;
  const container = document.getElementById(`damage-numbers-${playerId}`);
  if (!container) {
    console.warn(`Damage container not found for playerId: ${playerId}`);
    return;
  }
  const el = renderer.createElement('div');
  renderer.addClass(el, cssClass);
  renderer.appendChild(el, renderer.createText(text));
  renderer.setStyle(el, 'left', `${Math.random() * 60}%`);
  renderer.appendChild(container, el);
  setTimeout(() => { if (el.parentNode === container) renderer.removeChild(container, el); }, 3000);
}

const luckyFindRarityClass: Record<number, string> = {
  2: 'lucky-find-number--rare',
  3: 'lucky-find-number--epic',
  4: 'lucky-find-number--legendary',
  5: 'lucky-find-number--mythic',
};

/** Draft-phase equivalent of the battle damage numbers — floats a message up from the
 *  specific shop card (see `#item-{{$index}}` in shop.component.html) instead of queuing
 *  a Material snackbar toast for lucky shop-roll upgrades. */
export function triggerShopFloatingText(renderer: Renderer2, platformId: Object, slot: number, text: string, rarity?: number): void {
  if (!isPlatformBrowser(platformId)) return;
  const container = document.getElementById(`item-${slot}`);
  if (!container) {
    console.warn(`Shop slot container not found for slot: ${slot}`);
    return;
  }
  const el = renderer.createElement('div');
  renderer.addClass(el, 'lucky-find-number');
  const rarityClass = rarity != null ? luckyFindRarityClass[rarity] : undefined;
  if (rarityClass) renderer.addClass(el, rarityClass);
  renderer.appendChild(el, renderer.createText(text));
  renderer.appendChild(container, el);
  setTimeout(() => { if (el.parentNode === container) renderer.removeChild(container, el); }, 3500);
}

export function triggerHpDamageFlash(playerId: number): void {
  const el = document.getElementById(`hp-${playerId}`);
  if (!el) return;
  el.classList.remove('hp-damage', 'hp-heal');
  void el.offsetWidth;
  el.classList.add('hp-damage');
  setTimeout(() => el.classList.remove('hp-damage'), 450);
}

export function triggerHpHealFlash(playerId: number): void {
  const el = document.getElementById(`hp-${playerId}`);
  if (!el) return;
  el.classList.remove('hp-damage', 'hp-heal');
  void el.offsetWidth;
  el.classList.add('hp-heal');
  setTimeout(() => el.classList.remove('hp-heal'), 450);
}

export function triggerShowHealingNumber(renderer: Renderer2, platformId: Object, healing: number, playerId: number): void {
  if (!isPlatformBrowser(platformId)) return;
  const container = document.getElementById(`damage-numbers-${playerId}`);
  if (!container) {
    console.warn(`Healing container not found for playerId: ${playerId}`);
    return;
  }
  const el = renderer.createElement('div');
  renderer.addClass(el, 'healing-number');
  renderer.appendChild(el, renderer.createText(`+${healing}`));
  renderer.setStyle(el, 'left', `${Math.random() * 100}%`);
  renderer.setStyle(el, 'fontSize', `${18 + healing}px`);
  renderer.appendChild(container, el);
  setTimeout(() => { if (el.parentNode === container) renderer.removeChild(container, el); }, 3000);
}
