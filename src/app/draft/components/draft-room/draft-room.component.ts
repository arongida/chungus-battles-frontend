import {
  Component,
  Inject,
  OnInit,
  PLATFORM_ID,
  Renderer2,
  effect,
  signal,
  untracked,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DraftService } from '../../services/draft.service';
import {
  Player,
} from '../../../models/colyseus-schema/PlayerSchema';
import Item from '../../../models/colyseus-schema/ItemSchema';
import { ShopComponent } from '../shop/shop.component';
import {
  ReadyButtonComponent,
} from '../ready-button/ready-button.component';
import {
  Talent,
} from '../../../models/colyseus-schema/TalentSchema';
import {
  ItemCollection,
} from '../../../models/colyseus-schema/ItemCollectionSchema';
import {
  RoundInfoComponent,
} from '../../../common/components/round-info/round-info.component';
import {
  DraftToolbarComponent,
} from '../../../common/components/draft-toolbar/draft-toolbar.component';
import {
  SkillIconsComponent,
} from '../../../common/components/skill-icons/skill-icons.component';
import {
  MusicOptions,
  SoundOptions,
  SoundsService,
} from '../../../common/services/sounds.service';
import { RewardGainMessage, ShopFloatingMessage, TriggerItemMessage, TriggerTalentMessage } from '../../../models/types/MessageTypes';
import { triggerDraftLogFloatingText, triggerShopFloatingText, triggerShowGoldNumber, triggerShowXpNumber } from '../../../common/TriggerAnimations';

// Creates a typed Player from any schema object (typed or reflection-decoded generic).
// Copies primitive backing fields and collection references; skips `baseStats` because
// its Colyseus-generated setter calls assertInstanceType which fails with minified class
// names in production builds.
function coercePlayer(src: any): Player {
  if (!src) return new Player();
  const dest = new Player();
  Object.keys(src).forEach(key => {
    if (key === 'baseStats') return;
    try { (dest as any)[key] = src[key]; } catch {}
  });
  // Plain @type('number') fields without user-defined backing properties are stored via
  // Colyseus prototype getters/setters and won't appear in Object.keys — copy them explicitly.
  const plainFields: (keyof Player)[] = ['lives', 'playerId', 'originalPlayerId', 'xp', 'maxXp', 'round', 'wins', 'maxHp', 'income', 'hpRegen', 'dodgeRate', 'flatDmgReduction', 'refreshShopCost', 'gameVersion', 'comradeFreeClaim', 'goldGenieFreeClaim'];
  for (const field of plainFields) {
    const val = (src as any)[field];
    if (val !== undefined) (dest as any)[field] = val;
  }
  return dest;
}

@Component({
  selector: 'app-draft-room',
  standalone: true,
  imports: [
    ShopComponent,
    ReadyButtonComponent,
    RoundInfoComponent,
    ReadyButtonComponent,
    DraftToolbarComponent,
  ],
  templateUrl: './draft-room.component.html',
  styleUrl: './draft-room.component.scss',
})
export class DraftRoomComponent implements OnInit {
  player = signal<Player | undefined>(new Player(), { equal: () => false });
  shop = signal<Item[]>([]);
  availableTalents = signal<Talent[]>([]);
  availableCollections = signal<ItemCollection[]>([]);

  /** Queued `shop_floating` messages whose shop card wasn't in the DOM yet — retried on every
   *  subsequent state change (see comment at the `shop_floating` handler below). */
  private pendingShopFloatingTexts: (ShopFloatingMessage & { attempts: number })[] = [];
  private static readonly MAX_SHOP_FLOATING_ATTEMPTS = 20;

  /** Per-player cooldown for the reward_gain sound/burst — mirrors FightAnimationService's
   *  throttle so a flurry of small talent procs (e.g. an aura re-ticking) can't spam audio.
   *  The floating number itself is never throttled — each one carries the real amount gained. */
  private lastRewardSoundTime = new Map<number, number>();
  private static readonly REWARD_SOUND_THROTTLE_MS = 120;

  constructor(
    public draftService: DraftService,
    private soundsService: SoundsService,
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {
    effect(() => {
      const room = this.draftService.room();
      if (room) {
        // Apply current snapshot immediately — onStateChange does not replay on registration
        if (room.state?.player) {
          this.applyState(room.state);
        }
        room.onStateChange((state) => {
          this.applyState(state);
          this.flushPendingShopFloatingTexts();
        });
        room.onMessage('draft_log', (message: string) => {
          console.log('draft_log', message);
          triggerDraftLogFloatingText(this.renderer, this.platformId, message);
        });

        // Lucky shop-roll upgrades float over the affected card instead of toasting. The
        // message is guaranteed to arrive over the same connection before the Colyseus state
        // patch that renders the new shop card (custom sends and patches are ordered on the
        // wire), but the patch can still take more than one onStateChange tick to actually
        // reach the client — so we queue and retry from flushPendingShopFloatingTexts on every
        // subsequent state change instead of guessing with a single requestAnimationFrame.
        room.onMessage('shop_floating', (message: ShopFloatingMessage) => {
          if (!isPlatformBrowser(this.platformId)) return;
          // Don't flush immediately — the matching state patch reliably hasn't landed yet at
          // this point (see comment above). The very next onStateChange tick will already
          // include it, so just queue and let that drive the retry.
          this.pendingShopFloatingTexts.push({ ...message, attempts: 0 });
        });
        room.onMessage('reward_gain', (message: RewardGainMessage) => {
          this.applyRewardGain(message);
        });

        room.onMessage('trigger_talent', (message: TriggerTalentMessage) => {
          if (this.player()) {
            //triggerTalentActivation(message.talentId, message.playerId);
          }
        });

        room.onMessage('trigger_item', (message: TriggerItemMessage) => {
          if (this.player()) {
            //triggerItemActivation(message.playerId, message.slot);
          }
        });
      }
    });
  }

  async ngOnInit(): Promise<void> {
    this.soundsService.playMusic(MusicOptions.DRAFT);

    if (!this.draftService.room()) {
      await this.draftService.reconnect(untracked(() => localStorage.getItem('reconnectToken')) as string);
    }
  }

  private applyState(state: any): void {
    this.player.set(coercePlayer(state.player));
    this.shop.set([...(state.shop ?? [])] as unknown as Item[]);
    this.availableTalents.set([...(state.availableTalents ?? [])] as unknown as Talent[]);
    this.availableCollections.set([...(state.player?.availableItemCollections ?? [])] as unknown as ItemCollection[]);
    this.draftService.canUndoSell.set(!!state.canUndoSell);
  }

  /** Gold/xp gains during the shop round (sells, buying xp/leveling, talent procs). Floats
   *  the number over the player's avatar/header card (see character-details.component.html's
   *  `damage-numbers-{playerId}` overlay, present in every collapse state) and plays a
   *  throttled coin sound with a celebratory burst for sizeable gold gains. Xp gains get
   *  a floating number only — no sound for now. */
  private applyRewardGain(message: RewardGainMessage): void {
    if (!isPlatformBrowser(this.platformId)) return;

    if (message.gold) {
      triggerShowGoldNumber(this.renderer, this.platformId, Math.round(message.gold), message.playerId);
    }
    if (message.xp) {
      triggerShowXpNumber(this.renderer, this.platformId, Math.round(message.xp), message.playerId);
    }

    if (!message.gold) return;
    const now = performance.now();
    const last = this.lastRewardSoundTime.get(message.playerId) ?? 0;
    if (now - last < DraftRoomComponent.REWARD_SOUND_THROTTLE_MS) return;
    this.lastRewardSoundTime.set(message.playerId, now);

    this.soundsService.playSound(SoundOptions.GOLD);
  }

  /** Retries queued shop_floating messages once per state change (deferred one frame so the
   *  @for-rendered shop cards from the applyState() call just above have actually committed to
   *  the DOM) until each one's card exists. Gives up — and warns — after MAX attempts so a
   *  message for a slot that genuinely never renders can't accumulate forever. */
  private flushPendingShopFloatingTexts(): void {
    if (this.pendingShopFloatingTexts.length === 0 || !isPlatformBrowser(this.platformId)) return;
    requestAnimationFrame(() => {
      this.pendingShopFloatingTexts = this.pendingShopFloatingTexts.filter(pending => {
        if (triggerShopFloatingText(this.renderer, this.platformId, pending.slot, pending.text, pending.rarity, () => this.soundsService.playSound(SoundOptions.FIREWORK))) {
          return false;
        }
        pending.attempts++;
        if (pending.attempts >= DraftRoomComponent.MAX_SHOP_FLOATING_ATTEMPTS) {
          console.warn(`Shop slot container never appeared for slot: ${pending.slot} — giving up after ${pending.attempts} attempts`);
          return false;
        }
        return true;
      });
    });
  }
}
