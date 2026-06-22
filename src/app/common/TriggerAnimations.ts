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

/** Shared rarity → class-name-suffix lookup. Drives both the `.lucky-find-number--{suffix}`
 *  text color and the `.vfx-fireworks--{suffix}` burst tint, so the two always stay in sync. */
const luckyFindRaritySuffix: Record<number, string> = {
  2: 'rare',
  3: 'epic',
  4: 'legendary',
  5: 'mythic',
};

/** Higher rarities get a bigger fireworks celebration — more bursts staggered across the
 *  lucky-find text's 3.5s float (see `shopFloatUp` in styles.scss). Anything not listed here
 *  (common/rare/epic) falls back to DEFAULT_FIREWORKS_BURST_COUNT. */
const fireworksBurstCountByRaritySuffix: Record<string, number> = {
  legendary: 2,
  mythic: 3,
};
const DEFAULT_FIREWORKS_BURST_COUNT = 1;

/** Stagger is shorter than the burst's own playtime (FIREWORKS_BURST_DURATION_MS) so
 *  consecutive bursts overlap — the next one starts while the previous is still fading. */
const FIREWORKS_BURST_STAGGER_MS = 600;
const FIREWORKS_BURST_DURATION_MS = 800; // must match vfx-fireworks-play in styles.scss
const FIREWORKS_JITTER_PX = 32;

/** Spawns one fireworks burst inside `container`, jittered slightly off-center so staggered
 *  bursts don't all land in exactly the same spot. Re-checks `container.isConnected` since this
 *  runs on a delay and the shop card may have been removed (item sold/shop refreshed) by then.
 *  `onBurst` (if given) fires in the same tick the burst is mounted, so the sound stays in sync
 *  with the visual for every staggered burst, not just the first. */
function spawnFireworksBurst(renderer: Renderer2, container: HTMLElement, rarityClass: string | undefined, onBurst?: () => void): void {
  if (!container.isConnected) return;
  const fireworks = renderer.createElement('div');
  renderer.addClass(fireworks, 'vfx');
  renderer.addClass(fireworks, 'vfx-fireworks');
  if (rarityClass) renderer.addClass(fireworks, rarityClass);
  const dx = (Math.random() * 2 - 1) * FIREWORKS_JITTER_PX;
  const dy = (Math.random() * 2 - 1) * FIREWORKS_JITTER_PX;
  renderer.setStyle(fireworks, 'transform', `translate(calc(-50% + ${dx.toFixed(1)}px), calc(-50% + ${dy.toFixed(1)}px))`);
  renderer.appendChild(container, fireworks);
  onBurst?.();
  setTimeout(() => { if (fireworks.parentNode === container) renderer.removeChild(container, fireworks); }, FIREWORKS_BURST_DURATION_MS);
}

/** Draft-phase equivalent of the battle damage numbers — floats a message up from the
 *  specific shop card (see `#item-{{$index}}` in shop.component.html) instead of queuing
 *  a Material snackbar toast for lucky shop-roll upgrades.
 *
 *  Returns false (without warning) if the card isn't in the DOM yet — the `shop_floating`
 *  message can arrive before the Colyseus state patch that renders the new shop card lands,
 *  since custom messages and state patches are flushed on separate schedules. The caller
 *  (DraftRoomComponent) retries this on every subsequent state change until it succeeds.
 *
 *  `onFireworksBurst` (if given) is invoked once per spawned burst, at the exact moment that
 *  burst's animation starts — so a caller can fire a matching sound effect per burst (more
 *  bursts for rarer finds) instead of once for the whole celebration. */
export function triggerShopFloatingText(renderer: Renderer2, platformId: Object, slot: number, text: string, rarity?: number, onFireworksBurst?: () => void): boolean {
  if (!isPlatformBrowser(platformId)) return false;
  const container = document.getElementById(`item-${slot}`);
  if (!container) return false;
  const el = renderer.createElement('div');
  renderer.addClass(el, 'lucky-find-number');
  const raritySuffix = rarity != null ? luckyFindRaritySuffix[rarity] : undefined;
  if (raritySuffix) renderer.addClass(el, `lucky-find-number--${raritySuffix}`);
  renderer.appendChild(el, renderer.createText(text));
  renderer.appendChild(container, el);
  setTimeout(() => { if (el.parentNode === container) renderer.removeChild(container, el); }, 3500);

  // Lucky-find fireworks — one or more overlapping bursts (more for rarer finds), tinted to
  // match the rarity color (falls back to the text's default gold for common finds).
  const fireworksClass = raritySuffix ? `vfx-fireworks--${raritySuffix}` : undefined;
  const burstCount = raritySuffix ? (fireworksBurstCountByRaritySuffix[raritySuffix] ?? DEFAULT_FIREWORKS_BURST_COUNT) : DEFAULT_FIREWORKS_BURST_COUNT;
  for (let i = 0; i < burstCount; i++) {
    setTimeout(() => spawnFireworksBurst(renderer, container, fireworksClass, onFireworksBurst), i * FIREWORKS_BURST_STAGGER_MS);
  }

  return true;
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

export type VfxKind = 'slash' | 'fire' | 'poison' | 'heal';

/** Must match the sprite-sheet animation durations defined in styles.scss (`.vfx-{kind}`).
 *  `slash` has a randomized duration (see SLASH_DURATION_*_MS below) — this entry is just
 *  the upper bound, used as the cleanup fallback. */
const VFX_DURATION_MS: Record<VfxKind, number> = {
  slash: 360,
  fire: 800,
  poison: 700,
  heal: 900,
};

/** Impact-style VFX get a small random offset from center so repeated hits don't all
 *  land on the exact same spot / stack perfectly on top of each other. Heal stays
 *  centered — it reads as a whole-body effect, not a hit location. */
const VFX_JITTER_KINDS = new Set<VfxKind>(['fire', 'poison']);
const VFX_JITTER_X_PX = 36;
const VFX_JITTER_Y_PX = 24;

/** Slash hits randomize angle, facing, size and speed each time so consecutive strikes
 *  don't all look like the exact same canned animation. */
const SLASH_ANGLE_RANGE_DEG = 55;
const SLASH_SCALE_MIN = 0.85;
const SLASH_SCALE_MAX = 1.25;
const SLASH_DURATION_MIN_MS = 200;
const SLASH_DURATION_MAX_MS = 360;

/** Plays a sprite-sheet VFX (weapon slash, fire, poison cloud, heal glow) over the
 *  target's avatar. Mounts in the same `damage-numbers-{playerId}` overlay used for
 *  floating text, so it shares that container's stacking/positioning. */
export function triggerSpriteVfx(renderer: Renderer2, platformId: Object, kind: VfxKind, playerId: number): void {
  if (!isPlatformBrowser(platformId)) return;
  const container = document.getElementById(`damage-numbers-${playerId}`);
  if (!container) {
    console.warn(`Vfx container not found for playerId: ${playerId}`);
    return;
  }
  const el = renderer.createElement('div');
  renderer.addClass(el, 'vfx');
  renderer.addClass(el, `vfx-${kind}`);
  let duration = VFX_DURATION_MS[kind];
  if (kind === 'slash') {
    const dx = (Math.random() * 2 - 1) * VFX_JITTER_X_PX;
    const dy = (Math.random() * 2 - 1) * VFX_JITTER_Y_PX;
    const angle = (Math.random() * 2 - 1) * SLASH_ANGLE_RANGE_DEG;
    const flip = Math.random() < 0.5 ? -1 : 1;
    const scale = SLASH_SCALE_MIN + Math.random() * (SLASH_SCALE_MAX - SLASH_SCALE_MIN);
    renderer.setStyle(
      el,
      'transform',
      `translate(calc(-50% + ${dx.toFixed(1)}px), calc(-50% + ${dy.toFixed(1)}px)) rotate(${angle.toFixed(1)}deg) scale(${(flip * scale).toFixed(2)}, ${scale.toFixed(2)})`
    );
    duration = SLASH_DURATION_MIN_MS + Math.random() * (SLASH_DURATION_MAX_MS - SLASH_DURATION_MIN_MS);
    renderer.setStyle(el, 'animationDuration', `${duration.toFixed(0)}ms`);
  } else if (VFX_JITTER_KINDS.has(kind)) {
    const dx = (Math.random() * 2 - 1) * VFX_JITTER_X_PX;
    const dy = (Math.random() * 2 - 1) * VFX_JITTER_Y_PX;
    renderer.setStyle(el, 'transform', `translate(calc(-50% + ${dx.toFixed(1)}px), calc(-50% + ${dy.toFixed(1)}px))`);
  }
  renderer.appendChild(container, el);
  setTimeout(() => { if (el.parentNode === container) renderer.removeChild(container, el); }, duration);
}
