import {
  Component,
  effect,
  Inject,
  OnInit,
  PLATFORM_ID,
  Renderer2,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common'; // Import for platform check
import { FightService } from '../../services/fight.service';
import { Player } from '../../../models/colyseus-schema/PlayerSchema';
import {
  HealingMessage,
  DamageMessage,
  TriggerTalentMessage,
  TriggerCollectionMessage,
} from '../../../models/types/MessageTypes';
import { CombatLogComponent } from '../combat-log/combat-log.component';
import { DraftService } from '../../../draft/services/draft.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';
import { triggerTalentActivation, triggerItemCollectionActivation } from '../../../common/TriggerAnimations';
import { RoundInfoComponent } from '../../../common/components/round-info/round-info.component';
import { CharacterDetailsComponent } from '../../../common/components/character-details/character-details.component';
import { SkillIconsComponent } from '../../../common/components/skill-icons/skill-icons.component';
import { DraftToolbarComponent } from '../../../common/components/draft-toolbar/draft-toolbar.component';
import { MusicOptions, SoundOptions, SoundsService } from '../../../common/services/sounds.service';
import { EquipSlot } from '../../../models/types/ItemTypes';

@Component({
  selector: 'app-fight-room',
  standalone: true,
  imports: [
    DraftToolbarComponent,
    CombatLogComponent,
    MatTooltipModule,
    RoundInfoComponent,
    CharacterDetailsComponent,
    SkillIconsComponent,
  ],
  templateUrl: './fight-room.component.html',
  styleUrl: './fight-room.component.scss',
})
export class FightRoomComponent implements OnInit{
  player: Player | null = null;
  enemy: Player | null = null;
  combatLog: string = '';
  gameOver: boolean = false;
  battleOver: boolean = false;
  playerBeingHit = false;
  enemyBeingHit = false;

  constructor(
    private fightService: FightService,
    private draftService: DraftService,
    private snackBar: MatSnackBar,
    private router: Router,
    private soundsService: SoundsService,
    private renderer: Renderer2, // Inject Renderer2
    @Inject(PLATFORM_ID) private platformId: Object // Inject PLATFORM_ID
  ) {
    effect(() => {
      const room = this.fightService.room();
      if (room) {
        room.onStateChange((state) => {
          const plainPlayerObject = state.player;
          const plainEnemyObject = state.enemy;

          const player = new Player();
          const enemy = new Player();

          Object.assign(player, plainPlayerObject);
          Object.assign(enemy, plainEnemyObject);

          this.player = player;
          this.enemy = enemy;

          console.log('reassigning player');
        });

        room.onMessage('game_over', (message: string) => {
          this.openSnackBar(message, 'Exit', room.state.player.playerId, room.state.player.name, true);
          this.gameOver = true;
          this.battleOver = true;
        });

        room.onMessage('end_battle', () => {
          this.openSnackBar('The battle has ended', 'Exit', room.state.player.playerId, room.state.player.name);
          this.battleOver = true;
        });

        room.onMessage('combat_log', (message: string) => {
          const formattedMessage = message.replace(/(\d*\.\d+)/g, (match) => {
            return parseFloat(match).toFixed(2);
          });
          this.combatLog += formattedMessage + '\n';
        });

        room.onMessage('attack', (message: number) => {
          if (this.player && this.enemy) {
            this.triggerAttack(message);
          }
        });

        room.onMessage('damage', (message: DamageMessage) => {
          if (this.player && this.enemy) {
            const roundedDamage = Math.round(message.damage);
            this.triggerShowDamageNumber(roundedDamage, message.playerId);
            this.triggerDamagedAvatarImage(message.playerId)
          }
        });

        room.onMessage('healing', (message: HealingMessage) => {
          if (this.player && this.enemy) {
            const roundedHealing = Math.round(message.healing);
            this.triggerShowHealingNumber(roundedHealing, message.playerId);
          }
        });

        room.onMessage('trigger_talent', (message: TriggerTalentMessage) => {
          if (this.player && this.enemy) {
            triggerTalentActivation(message.talentId, message.playerId);
            console.log('trigger_talent', message);
          }
        });

        room.onMessage('trigger_collection', (message: TriggerCollectionMessage) => {
          if (this.player && this.enemy) {
            triggerItemCollectionActivation(message.collectionId, message.playerId);
            console.log('trigger_collection', message);
          }
        });
      }
    });
  }

  openSnackBar(message: string, action: string, playerId: number, name: string, gameOver: boolean = false) {
    const matSnackBarRef = this.snackBar.open(message, action);
    matSnackBarRef.onAction().subscribe(() => {
      this.endBattle(playerId, name, gameOver, message);
    });
  }

  async ngOnInit(): Promise<void> {
    this.soundsService.playMusic(MusicOptions.BATTLE);
    const room = this.fightService.room();
    if (!room) {
      await this.fightService.reconnect(localStorage.getItem('reconnectToken') as string);
    }
  }

  private async endBattle(playerId: number, name: string, gameOver: boolean = false, message: string) {
    this.fightService.leave(false);
    this.soundsService.stopMusic();
    if (gameOver) {
      if (message.includes('#1')) {
        this.router.navigate(['/end', { won: 'won' }]);
      } else {
        this.router.navigate(['/end', { won: 'lost' }]);
      }
    } else {
      const errorMessage = await this.draftService.joinOrCreate(name, playerId);
      if (errorMessage) {
        if (this.gameOver) {
          this.openSnackBar(message, 'Exit', this.player?.playerId ?? 0, this.player?.name ?? '', true);
        } else {
          this.openSnackBar('The battle has ended', 'Exit', this.player?.playerId ?? 0, this.player?.name ?? '');
        }
      }
    }
  }

  triggerShowHealingNumber(healing: number, playerId: number) {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const healingNumbersContainer = document.getElementById(`damage-numbers-${playerId}`);
    if (!healingNumbersContainer) {
      console.warn(`Healing container not found for playerId: ${playerId}`);
      return;
    }

    const healingNumber = this.renderer.createElement('div');
    this.renderer.addClass(healingNumber, 'healing-number');

    const textNode = this.renderer.createText(`+${healing}`);
    this.renderer.appendChild(healingNumber, textNode);

    this.renderer.setStyle(healingNumber, 'left', `${Math.random() * 100}%`);

    this.renderer.appendChild(healingNumbersContainer, healingNumber);

    setTimeout(() => {
      if (healingNumber.parentNode === healingNumbersContainer) {
        this.renderer.removeChild(healingNumbersContainer, healingNumber);
      }
    }, 3000);
  }

  triggerDamagedAvatarImage(damagedPlayerId: number) {

    if (damagedPlayerId === Number(localStorage.getItem("playerId"))) {
      this.playerBeingHit = true;
      setTimeout(() => {
        this.playerBeingHit = false;
      }, 200)
    } else {
      this.enemyBeingHit = true;
      setTimeout(() => {
        this.enemyBeingHit = false;
      }, 200)
    }
  }

  triggerShowDamageNumber(damage: number, defenderId: number) {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const damageNumbersContainer = document.getElementById(`damage-numbers-${defenderId}`);
    if (!damageNumbersContainer) {
      console.warn(`Damage container not found for defenderId: ${defenderId}`);
      return;
    }

    const damageNumber = this.renderer.createElement('div');
    this.renderer.addClass(damageNumber, 'damage-number');

    const textNode = this.renderer.createText(`-${damage}`);
    this.renderer.appendChild(damageNumber, textNode);

    this.renderer.setStyle(damageNumber, 'left', `${Math.random() * 100}%`);

    const minSize = 16;
    const scaleFactor = 0.5;
    this.renderer.setStyle(damageNumber, 'fontSize', `${minSize + damage * scaleFactor}px`);

    this.renderer.appendChild(damageNumbersContainer, damageNumber);

    setTimeout(() => {
      if (damageNumber.parentNode === damageNumbersContainer) { // Ensure it's still parented correctly
        this.renderer.removeChild(damageNumbersContainer, damageNumber);
      }
    }, 3000);
  }

  triggerAttack(attackerId: number) {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.soundsService.playSound(SoundOptions.ATTACK);

    const attackContainer = document.getElementById(`attack-${attackerId}`);
    if (!attackContainer) {
      console.warn(`Attack container not found for attackerId: ${attackerId}`);
      return;
    }

    // Remove previous attack animation element using Renderer2 if found
    let oldAttackElement: Element | null = null;
    if (attackerId === this.player?.playerId) {
      oldAttackElement = document.querySelector('.animate-attack');
    } else if (attackerId === this.enemy?.playerId) {
      oldAttackElement = document.querySelector('.animate-attack-enemy');
    }

    if (oldAttackElement && oldAttackElement.parentNode) {
      this.renderer.removeChild(oldAttackElement.parentNode, oldAttackElement);
    }

    // Create and configure new attack animation element
    const attackImg: HTMLImageElement = this.renderer.createElement('img');
    this.renderer.setStyle(attackImg, 'scale', '0.5');
    this.renderer.setStyle(attackImg, 'position', 'fixed');
    this.renderer.setStyle(attackImg, 'left', `${25 + Math.random() * 35}%`);
    this.renderer.setStyle(attackImg, 'zIndex', '100');

    let imgSrc = 'https://chungus-battles.b-cdn.net/chungus-battles-assets/Item_ID_81_Moldy_bread.png'; // Default image

    if (attackerId === this.player?.playerId && this.player) {
      this.renderer.addClass(attackImg, 'animate-attack');
      imgSrc = this.player.equippedItems.get(EquipSlot.MAIN_HAND)?.image || imgSrc;
    } else if (attackerId === this.enemy?.playerId && this.enemy) {
      this.renderer.addClass(attackImg, 'animate-attack-enemy');
      imgSrc = this.enemy.equippedItems.get(EquipSlot.MAIN_HAND)?.image || imgSrc;
    }
    this.renderer.setAttribute(attackImg, 'src', imgSrc);

    this.renderer.appendChild(attackContainer, attackImg);

  }
}
