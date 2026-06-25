import { Injectable, Renderer2, Signal, WritableSignal } from '@angular/core';
import { Player } from '../../models/colyseus-schema/PlayerSchema';
import { CombatLogEntry } from '../../models/types/CombatLogEntry';
import {
  DamageMessage,
  EndBattleMessage,
  HealingMessage,
  InvulnerableMessage,
  InvulnerableStateMessage,
  RewardGainMessage,
  TriggerItemMessage,
  TriggerTalentMessage,
  VersionWinMessage,
} from '../../models/types/MessageTypes';
import {
  triggerAvatarHit,
  triggerGoldBurst,
  triggerHpDamageFlash,
  triggerHpHealFlash,
  triggerItemActivation,
  triggerShowDamageNumber,
  triggerShowDodgeText,
  triggerShowGoldNumber,
  triggerShowHealingNumber,
  triggerShowInvulnerableText,
  triggerShowXpNumber,
  triggerSpriteVfx,
  triggerTalentActivation,
} from '../../common/TriggerAnimations';
import { SoundOptions, SoundsService } from '../../common/services/sounds.service';

export interface AnimationContext {
  renderer: Renderer2;
  platformId: Object;
  player: Signal<Player | null>;
  enemy: Signal<Player | null>;
  entries: WritableSignal<CombatLogEntry[]>;
  /** Called for every attack event — typically plays sounds in live mode. */
  triggerAttack: (attackerId: number) => void;
  /** Called for every damage event — typically animates avatar + sets being-hit signal. */
  triggerDamagedAvatar: (playerId: number) => void;
  onEndBattle?: (msg: EndBattleMessage) => void;
  onGameOver?: (msg: string) => void;
  onVersionWin?: (msg: VersionWinMessage) => void;
  /** Replay-only: mutates the Player signal's HP directly, since there is no Colyseus schema sync. */
  applyHpDelta?: (playerId: number, damage: number, healing: number) => void;
  /** Replay-only: mutates the Player signal's invincible flag, since there is no Colyseus schema sync. */
  setInvincible?: (playerId: number, invincible: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class FightAnimationService {
  constructor(private sounds: SoundsService) {}

  /** Per-(category, playerId) cooldown so a flurry of attacks or DoT ticks can't
   *  pile up overlapping VFX/SFX. Mirrors the throttle FightRoomComponent already
   *  uses for the weapon-swing sound. */
  private lastEffectTime = new Map<string, number>();
  private readonly EFFECT_THROTTLE_MS = 120;
  /** Gold gains at or above this amount get a celebratory fireworks burst in addition to
   *  the floating number — reserved for bigger payouts (fight-end income, loss bonus,
   *  jackpot-style talents) so routine +1 talent procs don't spam a burst every tick. */
  private readonly GOLD_BURST_THRESHOLD = 5;

  private throttled(key: string): boolean {
    const now = performance.now();
    const last = this.lastEffectTime.get(key) ?? 0;
    if (now - last < this.EFFECT_THROTTLE_MS) return true;
    this.lastEffectTime.set(key, now);
    return false;
  }

  applyCombatLog(ctx: AnimationContext, msg: CombatLogEntry): void {
    ctx.entries.update(prev => {
      const next = [...prev, msg];
      return next.length > 200 ? next.slice(-200) : next;
    });
    if (msg.kind === 'dodge' && msg.defenderId != null && ctx.player() && ctx.enemy()) {
      triggerShowDodgeText(ctx.renderer, ctx.platformId, msg.defenderId);
    }
  }

  applyAttack(ctx: AnimationContext, attackerId: number): void {
    if (ctx.player() && ctx.enemy()) {
      ctx.triggerAttack(attackerId);
    }
  }

  applyDamage(ctx: AnimationContext, msg: DamageMessage): void {
    if (ctx.player() && ctx.enemy()) {
      const type = msg.type ?? 'normal';
      triggerShowDamageNumber(ctx.renderer, ctx.platformId, Math.round(msg.damage), msg.playerId, type);
      triggerHpDamageFlash(msg.playerId);
      ctx.triggerDamagedAvatar(msg.playerId);
      ctx.applyHpDelta?.(msg.playerId, msg.damage, 0);

      if (!this.throttled(`damage:${type}:${msg.playerId}`)) {
        if (type === 'burn') {
          triggerSpriteVfx(ctx.renderer, ctx.platformId, 'fire', msg.playerId);
          this.sounds.playSound(SoundOptions.BURN);
        } else if (type === 'poison') {
          triggerSpriteVfx(ctx.renderer, ctx.platformId, 'poison', msg.playerId);
          this.sounds.playSound(SoundOptions.POISON);
        } else {
          triggerSpriteVfx(ctx.renderer, ctx.platformId, 'slash', msg.playerId);
          this.sounds.playSound(SoundOptions.HIT);
        }
      }
    }
  }

  applyInvulnerable(ctx: AnimationContext, msg: InvulnerableMessage): void {
    if (ctx.player() && ctx.enemy()) {
      triggerShowInvulnerableText(ctx.renderer, ctx.platformId, msg.playerId);
    }
  }

  applyInvulnerableState(ctx: AnimationContext, msg: InvulnerableStateMessage): void {
    ctx.setInvincible?.(msg.playerId, msg.invincible);
  }

  applyHealing(ctx: AnimationContext, msg: HealingMessage): void {
    if (ctx.player() && ctx.enemy()) {
      triggerShowHealingNumber(ctx.renderer, ctx.platformId, Math.round(msg.healing), msg.playerId);
      triggerHpHealFlash(msg.playerId);
      ctx.applyHpDelta?.(msg.playerId, 0, msg.healing);

      if (!this.throttled(`healing:${msg.playerId}`)) {
        triggerSpriteVfx(ctx.renderer, ctx.platformId, 'heal', msg.playerId);
        this.sounds.playSound(SoundOptions.HEAL);
      }
    }
  }

  /** Gold/xp gains — fired during the fight (fight-end income/xp, loss bonus, talent procs).
   *  Floating numbers always show (each carries the actual amount gained); the gold sound
   *  and burst are throttled per-player so a flurry of small talent procs in the same tick
   *  doesn't spam audio. Xp gains get a floating number only — no sound for now. */
  applyReward(ctx: AnimationContext, msg: RewardGainMessage): void {
    if (!(ctx.player() && ctx.enemy())) return;

    if (msg.gold) {
      triggerShowGoldNumber(ctx.renderer, ctx.platformId, Math.round(msg.gold), msg.playerId);
    }
    if (msg.xp) {
      triggerShowXpNumber(ctx.renderer, ctx.platformId, Math.round(msg.xp), msg.playerId);
    }

    if (msg.gold && !this.throttled(`reward:${msg.playerId}`)) {
      this.sounds.playSound(SoundOptions.GOLD);
      if (msg.gold >= this.GOLD_BURST_THRESHOLD) {
        triggerGoldBurst(ctx.renderer, ctx.platformId, msg.playerId);
      }
    }
  }

  applyTriggerTalent(ctx: AnimationContext, msg: TriggerTalentMessage): void {
    if (ctx.player() && ctx.enemy()) {
      triggerTalentActivation(msg.talentId, msg.playerId);
    }
  }

  applyTriggerItem(ctx: AnimationContext, msg: TriggerItemMessage): void {
    if (ctx.player() && ctx.enemy()) {
      triggerItemActivation(msg.playerId, msg.slot);
    }
  }

  applyTriggerAvatarHit(playerId: number): void {
    triggerAvatarHit(playerId);
  }

  /** Routes a raw replay event to the correct apply method. */
  dispatch(ctx: AnimationContext, type: string, payload: any): void {
    switch (type) {
      case 'combat_log':      this.applyCombatLog(ctx, payload as CombatLogEntry); break;
      case 'attack':          this.applyAttack(ctx, payload as number); break;
      case 'damage':          this.applyDamage(ctx, payload as DamageMessage); break;
      case 'invulnerable':    this.applyInvulnerable(ctx, payload as InvulnerableMessage); break;
      case 'invulnerable_state': this.applyInvulnerableState(ctx, payload as InvulnerableStateMessage); break;
      case 'healing':         this.applyHealing(ctx, payload as HealingMessage); break;
      case 'reward_gain':     this.applyReward(ctx, payload as RewardGainMessage); break;
      case 'trigger_talent':  this.applyTriggerTalent(ctx, payload as TriggerTalentMessage); break;
      case 'trigger_item':    this.applyTriggerItem(ctx, payload as TriggerItemMessage); break;
      case 'end_battle':      ctx.onEndBattle?.(payload as EndBattleMessage); break;
      case 'game_over':       ctx.onGameOver?.(payload as string); break;
      case 'version_win':     ctx.onVersionWin?.(payload as VersionWinMessage); break;
      default:                break;
    }
  }
}
