import { Injectable, Renderer2, Signal, WritableSignal } from '@angular/core';
import { Player } from '../../models/colyseus-schema/PlayerSchema';
import { CombatLogEntry } from '../../models/types/CombatLogEntry';
import {
  DamageMessage,
  EndBattleMessage,
  HealingMessage,
  InvulnerableMessage,
  InvulnerableStateMessage,
  TriggerItemMessage,
  TriggerTalentMessage,
  VersionWinMessage,
} from '../../models/types/MessageTypes';
import {
  triggerAvatarHit,
  triggerHpDamageFlash,
  triggerHpHealFlash,
  triggerItemActivation,
  triggerShowDamageNumber,
  triggerShowDodgeText,
  triggerShowHealingNumber,
  triggerShowInvulnerableText,
  triggerTalentActivation,
} from '../../common/TriggerAnimations';

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
      triggerShowDamageNumber(ctx.renderer, ctx.platformId, Math.round(msg.damage), msg.playerId, msg.type ?? 'normal');
      triggerHpDamageFlash(msg.playerId);
      ctx.triggerDamagedAvatar(msg.playerId);
      ctx.applyHpDelta?.(msg.playerId, msg.damage, 0);
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
      case 'trigger_talent':  this.applyTriggerTalent(ctx, payload as TriggerTalentMessage); break;
      case 'trigger_item':    this.applyTriggerItem(ctx, payload as TriggerItemMessage); break;
      case 'end_battle':      ctx.onEndBattle?.(payload as EndBattleMessage); break;
      case 'game_over':       ctx.onGameOver?.(payload as string); break;
      case 'version_win':     ctx.onVersionWin?.(payload as VersionWinMessage); break;
      default:                break;
    }
  }
}
