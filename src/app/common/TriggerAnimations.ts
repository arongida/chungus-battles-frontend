import { Renderer2, RendererStyleFlags2 } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DamageType } from '../models/types/MessageTypes';

export type HitSeverity = 'light' | 'medium' | 'heavy';

/** Size tier for floating combat numbers, from the amount relative to the target's max HP. */
export type NumberTier = 'sm' | 'md' | 'lg' | 'xl';

export function numberTier(amount: number, maxHp: number): NumberTier {
  const frac = maxHp > 0 ? amount / maxHp : 0;
  if (frac < 0.04) return 'sm';
  if (frac < 0.1) return 'md';
  if (frac < 0.2) return 'lg';
  return 'xl';
}

export function hitSeverity(tier: NumberTier): HitSeverity {
  return tier === 'sm' ? 'light' : tier === 'md' ? 'medium' : 'heavy';
}

const KNOCKBACK_PX: Record<HitSeverity, number> = { light: 4, medium: 8, heavy: 14 };
const HIT_DURATION_MS: Record<HitSeverity, number> = { light: 220, medium: 300, heavy: 460 };

/** Knockback keyframes per severity; `kb` is the signed outward distance. Heavy holds its peak
 *  (offsets .10 → .24) — a short hit-stop so big blows register. */
function knockbackFrames(severity: HitSeverity, kb: number): Keyframe[] {
  const at = (x: number, sx = 1, sy = 1) => `translateX(${x}px) scale(${sx}, ${sy})`;
  switch (severity) {
    case 'light': return [
      { transform: 'none' }, { transform: at(kb, 1.03, 0.97), offset: 0.25 }, { transform: 'none' }];
    case 'medium': return [
      { transform: 'none' }, { transform: at(kb, 1.06, 0.94), offset: 0.18 },
      { transform: at(-kb * 0.25, 0.98, 1.02), offset: 0.45 }, { transform: 'none' }];
    case 'heavy': return [
      { transform: 'none' }, { transform: at(kb, 1.1, 0.9), offset: 0.1 }, { transform: at(kb, 1.1, 0.9), offset: 0.24 },
      { transform: at(-kb * 0.35, 0.97, 1.03), offset: 0.42 }, { transform: at(kb * 0.15), offset: 0.62 }, { transform: 'none' }];
  }
}

const CARD_SHAKE_FRAMES: Keyframe[] = [
  { translate: '0 0' }, { translate: '-4px 2px' }, { translate: '4px -2px' }, { translate: '-3px -1px' },
  { translate: '3px 1px' }, { translate: '-1px 1px' }, { translate: '0 0' },
];

/** -1 if the element sits left of screen center, +1 otherwise — hits knock avatars outward,
 *  away from the opponent (panels are draggable, so this is measured, not assumed). */
function outwardDir(el: HTMLElement): number {
  const r = el.getBoundingClientRect();
  return r.left + r.width / 2 < window.innerWidth / 2 ? -1 : 1;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

/** Motion runs through the Web Animations API rather than CSS classes: the avatar/card already
 *  own CSS animations (aura pulses, the card's slideDown entrance) that a class-based animation
 *  would clobber and then replay on removal. One live motion per element; a new one replaces it. */
const liveMotion = new WeakMap<Element, Animation>();
function playMotion(el: Element, frames: Keyframe[], durationMs: number, opts: { fill?: FillMode; delayMs?: number } = {}): void {
  if (prefersReducedMotion()) return;
  liveMotion.get(el)?.cancel();
  liveMotion.set(el, el.animate(frames, { duration: durationMs, easing: 'ease-out', fill: opts.fill ?? 'none', delay: opts.delayMs ?? 0 }));
}

/** Attack wind-up: a small pull back, then a lunge toward the opponent (the inverse of
 *  outwardDir), plus a flash on the main-hand slot so you can see which fighter swung. */
export function triggerAvatarLunge(playerId: number): void {
  const el = document.getElementById(`avatar-${playerId}`);
  if (el) {
    const toward = -outwardDir(el);
    playMotion(el, [
      { transform: 'none' },
      { transform: `translateX(${-toward * 4}px) scale(0.98, 1.02)`, offset: 0.3 },
      { transform: `translateX(${toward * 12}px) scale(1.05, 0.96)`, offset: 0.55 },
      { transform: 'none' },
    ], 260);
  }
  const weapon = document.getElementById(`equipped-slot-mainHand-${playerId}`);
  if (weapon) restartClass(weapon, 'animate-weapon-attack', 400);
}

/** Can't-afford feedback: the toolbar gold counter (#gold-counter) flashes red and shakes. */
export function triggerGoldDeny(): void {
  const el = document.getElementById('gold-counter');
  if (el) restartClass(el, 'gold-deny', 450);
}

/** Bought item: a copy of its image arcs from the shop card into the character panel (the
 *  #character-panel-buy-zone drop target), which pulses when it lands. Called once the server
 *  has confirmed the purchase (the slot flipped to sold), not optimistically on click. */
export function triggerItemFly(renderer: Renderer2, platformId: Object, imageUrl: string, fromEl: HTMLElement, targetId = 'character-panel-buy-zone'): void {
  if (!isPlatformBrowser(platformId) || prefersReducedMotion()) return;
  const target = document.getElementById(targetId);
  if (!target || !imageUrl) return;
  const from = fromEl.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  const size = Math.min(from.width, from.height) * 0.55;
  const img = renderer.createElement('img') as HTMLImageElement;
  img.src = imageUrl;
  renderer.addClass(img, 'item-fly');
  renderer.setStyle(img, 'width', `${size}px`);
  renderer.setStyle(img, 'height', `${size}px`);
  renderer.setStyle(img, 'left', `${from.left + from.width / 2 - size / 2}px`);
  renderer.setStyle(img, 'top', `${from.top + from.height / 2 - size / 2}px`);
  renderer.appendChild(document.body, img);
  const dx = to.left + Math.min(to.width / 2, 120) - (from.left + from.width / 2);
  const dy = to.top + Math.min(to.height / 2, 140) - (from.top + from.height / 2);
  const anim = img.animate([
    { transform: 'translate(0, 0) scale(1)', opacity: 1 },
    { transform: `translate(${dx * 0.35}px, ${dy * 0.35 - 70}px) scale(1.15) rotate(-8deg)`, opacity: 1, offset: 0.35 },
    { transform: `translate(${dx}px, ${dy}px) scale(0.35) rotate(10deg)`, opacity: 0.2 },
  ], { duration: 520, easing: 'cubic-bezier(0.5, 0, 0.75, 0)' });
  anim.onfinish = () => {
    img.remove();
    restartClass(target, 'panel-receive', 380);
  };
}

/** Level-up celebration over the player's panel: a pixel light pillar plus a "LEVEL UP!" slam. */
export function triggerLevelUpBurst(renderer: Renderer2, platformId: Object, playerId: number): void {
  triggerSpriteVfx(renderer, platformId, 'level-up', playerId);
  spawnFloat(renderer, platformId, playerId, 'LEVEL UP!', ['ft', 'ft-slam', 'ft-levelup'], 1300);
}

/** Undoes triggerKnockOut (replay restart re-uses the same avatar elements). */
export function clearKnockOut(playerIds: number[]): void {
  for (const id of playerIds) {
    const el = document.getElementById(`avatar-${id}`);
    if (!el) continue;
    el.classList.remove('avatar-ko');
    liveMotion.get(el)?.cancel();
  }
}

/** End-of-fight beat: the loser gets knocked back, tips over and greys out (held until the
 *  view is torn down) under a big "K.O.!" slam; the winner does a little victory hop. */
export function triggerKnockOut(renderer: Renderer2, platformId: Object, loserIds: number[], winnerId?: number): void {
  if (!isPlatformBrowser(platformId)) return;
  // game_over can follow end_battle for the same fight — only knock each fighter out once.
  const fresh = loserIds.filter(id => !document.getElementById(`avatar-${id}`)?.classList.contains('avatar-ko'));
  if (fresh.length === 0) return;
  for (const id of fresh) {
    const el = document.getElementById(`avatar-${id}`);
    if (!el) continue;
    const out = outwardDir(el);
    el.classList.add('avatar-ko');
    playMotion(el, [
      { transform: 'none' },
      { transform: `translateX(${out * 20}px) scale(1.12, 0.88)`, offset: 0.12 },
      { transform: `translateX(${out * 20}px) scale(1.12, 0.88)`, offset: 0.3 },
      { transform: `translateX(${out * 12}px) translateY(8px) rotate(${out * 12}deg)` },
    ], 700, { fill: 'forwards' });
    spawnFloat(renderer, platformId, id, 'K.O.!', ['ft', 'ft-slam', 'ft-ko'], 1600);
  }
  if (winnerId != null) {
    const el = document.getElementById(`avatar-${winnerId}`);
    if (el) playMotion(el, [
      { transform: 'none' },
      { transform: 'translateY(-12px) scale(0.96, 1.06)', offset: 0.25 },
      { transform: 'none', offset: 0.5 },
      { transform: 'translateY(-5px)', offset: 0.72 },
      { transform: 'none' },
    ], 700, { delayMs: 300 });
  }
}

/** Restarts a one-shot CSS animation class, even if it's mid-flight from a previous hit. */
function restartClass(el: Element, cls: string, ms: number): void {
  el.classList.remove(cls);
  void (el as HTMLElement).offsetWidth;
  el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), ms);
}

/** Struck-avatar feedback: white flash + directional knockback with squash, scaled by severity.
 *  Heavy hits also hit-stop, shake the whole character card, and — when `vignette` is set (the
 *  local player got hit) — flash red screen edges. DoT ticks skip the knockback and just pulse a
 *  poison/burn tint so they read as ticks, not blows. */
export function triggerAvatarHit(playerId: number, opts: { severity?: HitSeverity; dot?: 'poison' | 'burn'; vignette?: boolean } = {}) {
  const el = document.getElementById(`avatar-${playerId}`);
  if (!el) return;
  if (opts.dot) {
    restartClass(el, `avatar-tint--${opts.dot}`, 360);
    return;
  }
  const severity = opts.severity ?? 'medium';
  playMotion(el, knockbackFrames(severity, outwardDir(el) * KNOCKBACK_PX[severity]), HIT_DURATION_MS[severity]);
  restartClass(el, 'avatar-flash', 140);
  if (severity === 'heavy') {
    const card = el.closest('app-character-details')?.firstElementChild;
    if (card) playMotion(card, CARD_SHAKE_FRAMES, 360);
    if (opts.vignette) triggerHitVignette();
  }
}

let vignetteEl: HTMLElement | null = null;
function triggerHitVignette(): void {
  if (!vignetteEl || !vignetteEl.isConnected) {
    vignetteEl = document.createElement('div');
    vignetteEl.className = 'hit-vignette';
    document.body.appendChild(vignetteEl);
  }
  restartClass(vignetteEl, 'hit-vignette--on', 420);
}

/** Dodge: quick blink-sidestep outward plus a speed-streak sprite. */
export function triggerAvatarDodge(renderer: Renderer2, platformId: Object, playerId: number): void {
  if (!isPlatformBrowser(platformId)) return;
  const el = document.getElementById(`avatar-${playerId}`);
  if (!el) return;
  const dir = outwardDir(el);
  // Blink-sidestep: two quick flickers while displaced read as an afterimage.
  playMotion(el, [
    { transform: 'none', opacity: 1 },
    { transform: `translateX(${dir * 18}px) skewX(${dir * -10}deg)`, opacity: 0.35, offset: 0.2 },
    { opacity: 0.85, offset: 0.35 },
    { transform: `translateX(${dir * 18}px)`, opacity: 0.4, offset: 0.5 },
    { transform: 'none', opacity: 1 },
  ], 320);
  triggerSpriteVfx(renderer, platformId, 'dodge', playerId, false, dir);
}

/** Absorbed hit (invulnerable / Brace block): tiny "tink" recoil plus a hex deflect flash. */
export function triggerAvatarDeflect(renderer: Renderer2, platformId: Object, playerId: number): void {
  if (!isPlatformBrowser(platformId)) return;
  const el = document.getElementById(`avatar-${playerId}`);
  if (el) playMotion(el, knockbackFrames('light', outwardDir(el) * 3), HIT_DURATION_MS.light);
  triggerSpriteVfx(renderer, platformId, 'shield-ping', playerId);
}

/** The impact slash is styled by the damage event; the combat log supplies its label. */
export function triggerEmpoweredHit(renderer: Renderer2, platformId: Object, defenderId: number): void {
  spawnFloat(renderer, platformId, defenderId, 'EMPOWERED!', ['empowered-number'], 1100);
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

export function triggerShowDamageNumber(renderer: Renderer2, platformId: Object, damage: number, defenderId: number, type: DamageType = 'normal', tier: NumberTier = 'md'): void {
  if (type === 'poison' || type === 'burn') {
    // DoT ticks: small, no overshoot — they should read as a steady drip, not a blow.
    spawnFloat(renderer, platformId, defenderId, `-${damage}`, ['ft', 'ft-tick', `ft-dmg--${type}`], 800);
    return;
  }
  spawnFloat(renderer, platformId, defenderId, `-${damage}`, ['ft', 'ft-pop', 'ft-dmg', `ft--${tier}`], tier === 'xl' ? 1200 : 950);
}

export function triggerShowDodgeText(renderer: Renderer2, platformId: Object, defenderId: number): void {
  spawnFloat(renderer, platformId, defenderId, 'DODGE', ['ft', 'ft-dodge', 'ft-dodge-text'], 800, { dir: true });
}

export function triggerShowInvulnerableText(renderer: Renderer2, platformId: Object, playerId: number): void {
  spawnFloat(renderer, platformId, playerId, 'IMMUNE', ['ft', 'ft-slam', 'ft-shield'], 1000);
}

/** Brace (shield skill): one hit fully negated — same shield styling as invulnerable. */
export function triggerShowBlockText(renderer: Renderer2, platformId: Object, defenderId: number): void {
  spawnFloat(renderer, platformId, defenderId, 'BLOCK', ['ft', 'ft-slam', 'ft-shield'], 1000);
}

/** Shown over the STUNNED player (the one who just attacked into the shield for Shield Bash). */
export function triggerShowStunnedText(renderer: Renderer2, platformId: Object, stunnedPlayerId: number): void {
  spawnFloat(renderer, platformId, stunnedPlayerId, 'STUNNED!', ['ft', 'ft-slam', 'ft-stun'], 1100);
}

/** Floats hitting the same avatar within this window stack upward instead of overlapping. */
const FLOAT_STACK_WINDOW_MS = 180;
const FLOAT_STACK_STEP_PX = 18;
const FLOAT_STACK_MAX = 4;
const floatStack = new WeakMap<HTMLElement, { t: number; n: number }>();

/** Shared floating-text spawner for the `damage-numbers-{playerId}` avatar overlay. `classes`
 *  (normally `ft` + a motion + a palette class) pick the motion (`ft-pop`/`ft-rise`/`ft-slam`/`ft-dodge`/`ft-tick`) and palette; see `.ft` in
 *  styles.scss. Motion is driven by CSS vars: --dx (arc drift), --sy (stack offset), --dir. */
function spawnFloat(renderer: Renderer2, platformId: Object, playerId: number, text: string, classes: string[], lifetimeMs: number, opts: { dir?: boolean } = {}): void {
  if (!isPlatformBrowser(platformId)) return;
  const container = document.getElementById(`damage-numbers-${playerId}`);
  if (!container) {
    console.warn(`Damage container not found for playerId: ${playerId}`);
    return;
  }
  spawnFloatIn(renderer, container, text, classes, lifetimeMs, opts);
}

/** Floating text anchored to any element by id (e.g. the toolbar gold counter). The container
 *  must be positioned (relative/absolute) — see spawnFloat for the classes/motion contract. */
export function triggerFloatIn(renderer: Renderer2, platformId: Object, containerId: string, text: string, classes: string[], lifetimeMs: number): void {
  if (!isPlatformBrowser(platformId)) return;
  const container = document.getElementById(containerId);
  if (container) spawnFloatIn(renderer, container, text, classes, lifetimeMs);
}

function spawnFloatIn(renderer: Renderer2, container: HTMLElement, text: string, classes: string[], lifetimeMs: number, opts: { dir?: boolean } = {}): void {
  const now = performance.now();
  const prev = floatStack.get(container);
  const n = prev && now - prev.t < FLOAT_STACK_WINDOW_MS ? Math.min(prev.n + 1, FLOAT_STACK_MAX) : 0;
  floatStack.set(container, { t: now, n });

  const el = renderer.createElement('div');
  classes.forEach(c => renderer.addClass(el, c));
  renderer.appendChild(el, renderer.createText(text));
  const side = Math.random() < 0.5 ? -1 : 1;
  renderer.setStyle(el, 'left', `${30 + Math.random() * 40}%`);
  renderer.setStyle(el, 'top', `${18 + Math.random() * 16}%`);
  renderer.setStyle(el, '--dx', `${side * (14 + Math.random() * 18)}px`, RendererStyleFlags2.DashCase);
  renderer.setStyle(el, '--sy', `${-n * FLOAT_STACK_STEP_PX}px`, RendererStyleFlags2.DashCase);
  if (opts.dir) renderer.setStyle(el, '--dir', `${outwardDir(container)}`, RendererStyleFlags2.DashCase);
  renderer.appendChild(container, el);
  setTimeout(() => { if (el.parentNode === container) renderer.removeChild(container, el); }, lifetimeMs + 50);
}

/** Shared rarity → class-name-suffix lookup. Drives both the `.lucky-find-number--{suffix}`
 *  text color and the `.vfx-fireworks--{suffix}` burst tint, so the two always stay in sync. */
const luckyFindRaritySuffix: Record<number, string> = {
  2: 'rare',
  3: 'epic',
  4: 'legendary',
  5: 'mythic',
};

/** Only legendary and mythic lucky finds get fireworks — lower rarities just show the
 *  floating text. Legendary gets 2 overlapping bursts, mythic gets 3. */
const fireworksBurstCountByRaritySuffix: Record<string, number> = {
  legendary: 2,
  mythic: 3,
};

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

/** Back-to-back draft logs (e.g. a potion drink + its brew) stack upward instead of overlapping. */
const DRAFT_LOG_STACK_WINDOW_MS = 400;
const DRAFT_LOG_STACK_STEP_PX = 34;
const DRAFT_LOG_LIFETIME_MS = 3200; // must match draftLogPop in styles.scss
let draftLogStack = { t: 0, n: 0 };

/** Draft-phase event notification — pops a message in at the bottom of the screen (the
 *  full-width `#draft-log-floats` fixed container) instead of a Material snackbar toast. */
export function triggerDraftLogFloatingText(renderer: Renderer2, platformId: Object, text: string): void {
  if (!isPlatformBrowser(platformId)) return;
  const container = document.getElementById('draft-log-floats');
  if (!container) {
    console.warn('[TriggerAnimations] #draft-log-floats container not found');
    return;
  }
  const now = performance.now();
  const n = now - draftLogStack.t < DRAFT_LOG_STACK_WINDOW_MS ? Math.min(draftLogStack.n + 1, 3) : 0;
  draftLogStack = { t: now, n };
  const el = renderer.createElement('div');
  renderer.addClass(el, 'draft-log-float');
  renderer.appendChild(el, renderer.createText(text));
  renderer.setStyle(el, '--sy', `${-n * DRAFT_LOG_STACK_STEP_PX}px`, RendererStyleFlags2.DashCase);
  renderer.appendChild(container, el);
  setTimeout(() => { if (el.parentNode === container) renderer.removeChild(container, el); }, DRAFT_LOG_LIFETIME_MS + 50);
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

  // Lucky-find fireworks — legendary and mythic only; lower rarities just show the text.
  const burstCount = raritySuffix ? (fireworksBurstCountByRaritySuffix[raritySuffix] ?? 0) : 0;
  if (burstCount > 0) {
    const fireworksClass = `vfx-fireworks--${raritySuffix}`;
    for (let i = 0; i < burstCount; i++) {
      setTimeout(() => spawnFireworksBurst(renderer, container, fireworksClass, onFireworksBurst), i * FIREWORKS_BURST_STAGGER_MS);
    }
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

export function triggerShowHealingNumber(renderer: Renderer2, platformId: Object, healing: number, playerId: number, tier: NumberTier = 'md'): void {
  spawnFloat(renderer, platformId, playerId, `+${healing}`, ['ft', 'ft-rise', 'ft-heal', `ft--${tier}`], 1100);
}

export function triggerShowGoldNumber(renderer: Renderer2, platformId: Object, amount: number, playerId: number): void {
  spawnFloat(renderer, platformId, playerId, `+${amount} 🟡`, ['ft', 'ft-rise', 'ft-gold', amount >= 10 ? 'ft--lg' : 'ft--md'], 1200);
}

export function triggerShowXpNumber(renderer: Renderer2, platformId: Object, amount: number, playerId: number): void {
  spawnFloat(renderer, platformId, playerId, `+${amount} XP`, ['ft', 'ft-rise', 'ft-xp', 'ft--md'], 1200);
}

/** Draft-phase "Lucky Find mastery" gain — floats "+2% 🍀" over the buyer's avatar (the same
 *  `damage-numbers-{playerId}` overlay used by gold/xp numbers) when a Mythic buy/upgrade grants
 *  the permanent Lucky Find bonus. Anchored to the avatar rather than the shop card, since an
 *  upgrade-preview buy destroys and recreates the item's DOM node — a card-anchored celebration
 *  could get yanked out mid-animation. */
export function triggerShowLuckyFindBonusNumber(renderer: Renderer2, platformId: Object, playerId: number): void {
  spawnFloat(renderer, platformId, playerId, '+2% 🍀', ['ft', 'ft-rise', 'ft-lucky', 'ft--lg'], 1400);
}

/** Mythic-tinted fireworks (same 3-burst sequence as a shop-roll Mythic upgrade) mounted on the
 *  avatar's damage-numbers overlay instead of the shop card — see triggerShowLuckyFindBonusNumber
 *  for why. `onBurst` fires per burst so the caller can play a matching sound each time. */
export function triggerLuckyFindBonusFireworks(renderer: Renderer2, platformId: Object, playerId: number, onBurst?: () => void): void {
  if (!isPlatformBrowser(platformId)) return;
  const container = document.getElementById(`damage-numbers-${playerId}`);
  if (!container) return;
  const burstCount = fireworksBurstCountByRaritySuffix['mythic'];
  for (let i = 0; i < burstCount; i++) {
    setTimeout(() => spawnFireworksBurst(renderer, container, 'vfx-fireworks--mythic', onBurst), i * FIREWORKS_BURST_STAGGER_MS);
  }
}

/** Celebratory burst for sizeable gold gains (e.g. fight-end income, loss consolation) — reuses
 *  the gold-tinted default `.vfx-fireworks` sprite, mounted into the same damage-numbers overlay
 *  used for the floating text. Callers should reserve this for larger amounts; spamming it on
 *  every +1 talent proc would be noisy (see FightAnimationService/DraftRoomComponent for the
 *  threshold that decides when to call this). */
export function triggerGoldBurst(renderer: Renderer2, platformId: Object, playerId: number): void {
  if (!isPlatformBrowser(platformId)) return;
  const container = document.getElementById(`damage-numbers-${playerId}`);
  if (!container) return;
  spawnFireworksBurst(renderer, container, undefined);
}

/** Full-screen fireworks celebration for major win events (version win, all-time win). Mounts
 *  a temporary fixed overlay on `document.body`, scatters `burstCount` fireworks bursts at
 *  random screen positions (staggered so they don't all land at once), then removes the overlay
 *  once the last burst finishes. `onBurst` fires in the same tick each burst starts so the
 *  caller can play a matching sound per burst rather than once for the whole sequence. */
export function triggerCelebrationFireworks(renderer: Renderer2, platformId: Object, burstCount: number, onBurst?: () => void): void {
  if (!isPlatformBrowser(platformId)) return;
  const overlay = renderer.createElement('div');
  renderer.addClass(overlay, 'celebration-vfx-layer');
  renderer.appendChild(document.body, overlay);

  const totalDuration = (burstCount - 1) * FIREWORKS_BURST_STAGGER_MS + FIREWORKS_BURST_DURATION_MS;
  for (let i = 0; i < burstCount; i++) {
    setTimeout(() => {
      if (!overlay.isConnected) return;
      const burst = renderer.createElement('div');
      renderer.addClass(burst, 'vfx');
      renderer.addClass(burst, 'vfx-fireworks');
      // Random position across the viewport so bursts scatter rather than stacking
      const left = 10 + Math.random() * 80; // 10%–90% from left
      const top = 10 + Math.random() * 70;  // 10%–80% from top
      renderer.setStyle(burst, 'left', `${left.toFixed(1)}%`);
      renderer.setStyle(burst, 'top', `${top.toFixed(1)}%`);
      // The existing sprite is centered via translate(-50%,-50%) in styles.scss; no extra
      // transform needed here — position is absolute within the fixed overlay.
      renderer.setStyle(burst, 'transform', 'translate(-50%, -50%)');
      renderer.appendChild(overlay, burst);
      onBurst?.();
      setTimeout(() => { if (burst.parentNode === overlay) renderer.removeChild(overlay, burst); }, FIREWORKS_BURST_DURATION_MS);
    }, i * FIREWORKS_BURST_STAGGER_MS);
  }

  setTimeout(() => { if (overlay.parentNode === document.body) renderer.removeChild(document.body, overlay); }, totalDuration + 100);
}

export type VfxKind = 'slash' | 'fire' | 'poison' | 'heal' | 'spark' | 'shield-ping' | 'dodge' | 'coins' | 'level-up';

/** Must match the sprite-sheet animation durations defined in styles.scss (`.vfx-{kind}`).
 *  `slash` has a randomized duration (see SLASH_DURATION_*_MS below) — this entry is just
 *  the upper bound, used as the cleanup fallback. */
const VFX_DURATION_MS: Record<VfxKind, number> = {
  slash: 360,
  spark: 250,
  fire: 560,
  poison: 640,
  heal: 900,
  'shield-ping': 300,
  dodge: 250,
  coins: 490,
  'level-up': 800,
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

function mountVfx(renderer: Renderer2, container: HTMLElement, classes: string[], transform: string | null, durationMs: number): HTMLElement {
  const el = renderer.createElement('div');
  renderer.addClass(el, 'vfx');
  classes.forEach(c => renderer.addClass(el, c));
  if (transform) renderer.setStyle(el, 'transform', transform);
  renderer.appendChild(container, el);
  setTimeout(() => { if (el.parentNode === container) renderer.removeChild(container, el); }, durationMs);
  return el;
}

/** Plays a sprite-sheet VFX over the target's avatar. Mounts in the same `damage-numbers-{playerId}`
 *  overlay used for floating text, so it shares that container's stacking/positioning. Slashes
 *  also drop a pixel impact spark (gold when empowered) at the same spot. `dir` flips directional
 *  sheets (dodge streak) to match the avatar's movement. */
export function triggerSpriteVfx(renderer: Renderer2, platformId: Object, kind: VfxKind, playerId: number, empowered = false, dir = 1): void {
  if (!isPlatformBrowser(platformId)) return;
  const container = document.getElementById(`damage-numbers-${playerId}`);
  if (!container) {
    console.warn(`Vfx container not found for playerId: ${playerId}`);
    return;
  }
  const jitter = () => {
    const dx = (Math.random() * 2 - 1) * VFX_JITTER_X_PX;
    const dy = (Math.random() * 2 - 1) * VFX_JITTER_Y_PX;
    return `translate(calc(-50% + ${dx.toFixed(1)}px), calc(-50% + ${dy.toFixed(1)}px))`;
  };
  if (kind === 'slash') {
    const at = jitter();
    const angle = (Math.random() * 2 - 1) * SLASH_ANGLE_RANGE_DEG;
    const flip = Math.random() < 0.5 ? -1 : 1;
    const scale = SLASH_SCALE_MIN + Math.random() * (SLASH_SCALE_MAX - SLASH_SCALE_MIN);
    const duration = SLASH_DURATION_MIN_MS + Math.random() * (SLASH_DURATION_MAX_MS - SLASH_DURATION_MIN_MS);
    mountVfx(renderer, container, ['vfx-spark', ...(empowered ? ['vfx-spark--gold'] : [])], at, VFX_DURATION_MS.spark);
    const slash = mountVfx(
      renderer, container, ['vfx-slash', ...(empowered ? ['vfx-slash--empowered'] : [])],
      `${at} rotate(${angle.toFixed(1)}deg) scale(${(flip * scale).toFixed(2)}, ${scale.toFixed(2)})`,
      duration,
    );
    renderer.setStyle(slash, 'animationDuration', `${duration.toFixed(0)}ms`);
    return;
  }
  const transform = VFX_JITTER_KINDS.has(kind) ? jitter()
    : kind === 'dodge' ? `translate(-50%, -50%) scaleX(${dir})`
    : null;
  mountVfx(renderer, container, [`vfx-${kind}`], transform, VFX_DURATION_MS[kind]);
}
