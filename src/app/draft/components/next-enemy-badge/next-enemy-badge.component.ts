import { Component, ElementRef, Input, OnDestroy, ViewContainerRef } from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { MatDialog } from '@angular/material/dialog';
import { Player } from '../../../models/colyseus-schema/PlayerSchema';
import { EnemyRevealLevel } from '../../../models/types/EnemyPreview';
import { CharacterDetailsComponent } from '../../../common/components/character-details/character-details.component';
import { CharacterDetailsDialogComponent, CharacterDetailsDialogData } from '../../../common/components/character-details-dialog/character-details-dialog.component';
import { InfoBoxService } from '../../../common/services/info-box.service';
import { FightService } from '../../../fight/services/fight.service';
import { environment } from '../../../../environments/environment';

/**
 * "vs <enemy>" badge shown near the ready button during draft — previews the next fight
 * opponent that the server pre-selected and locked in (DraftState.nextEnemy).
 *
 * Desktop: hover opens a CDK overlay with the character-details panel (same pattern as
 * ItemHoverCardDirective). Touch: tap opens the CharacterDetailsDialogComponent modal.
 * Redaction is server-side — this component only shapes the UI via revealLevel.
 */
@Component({
  selector: 'app-next-enemy-badge',
  standalone: true,
  imports: [],
  templateUrl: './next-enemy-badge.component.html',
  styleUrl: './next-enemy-badge.component.scss',
})
export class NextEnemyBadgeComponent implements OnDestroy {
  @Input({ required: true }) enemy: Player = new Player();
  @Input({ required: true }) revealLevel = -1;
  /** Talent/item classes of the next opponent (duplicates kept — the panel shows ×N chips). */
  @Input() talentClasses: string[] = [];
  @Input() itemClasses: string[] = [];

  private overlayRef: OverlayRef | null = null;

  /** Dev next-fight-picker can override the locked-in pick (dev builds only) — flag it. */
  readonly devPickerEnabled = environment.enemyPicker;

  constructor(
    private overlay: Overlay,
    private elementRef: ElementRef,
    private viewContainerRef: ViewContainerRef,
    private dialog: MatDialog,
    private infoBoxService: InfoBoxService,
    public fightService: FightService,
  ) {}

  get visible(): boolean {
    return this.revealLevel >= 0 && !!this.enemy?.name;
  }

  get isFullReveal(): boolean {
    return this.revealLevel >= EnemyRevealLevel.FULL;
  }

  /** Enemy portrait variant, mirroring CharacterDetailsComponent.getNormalAvatarImage. */
  getBadgeAvatar(): string {
    const avatar = this.enemy?.avatarUrl || 'assets/Portrait_ID_0_Placeholder.png';
    return avatar.replace('.png', '_enemy.png');
  }

  onMouseEnter(): void {
    if (this.infoBoxService.isTouch || !this.visible) return;
    this.openOverlay();
  }

  onMouseLeave(): void {
    if (this.infoBoxService.isTouch) return;
    this.closeOverlay();
  }

  onClick(): void {
    if (!this.infoBoxService.isTouch || !this.visible) return;
    this.openDialog();
  }

  private openOverlay(): void {
    if (this.overlayRef?.hasAttached()) return;

    this.overlayRef = this.overlay.create({
      positionStrategy: this.overlay
        .position()
        .flexibleConnectedTo(this.elementRef)
        .withFlexibleDimensions(false)
        .withPositions([
          { originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom', offsetY: -8 },
          { originX: 'start', originY: 'center', overlayX: 'end', overlayY: 'center', offsetX: -8 },
          { originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top', offsetY: 8 },
        ]),
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
    });

    const portal = new ComponentPortal(CharacterDetailsComponent, this.viewContainerRef);
    const componentRef = this.overlayRef.attach(portal);
    componentRef.setInput('player', this.enemy);
    componentRef.setInput('enemy', true);
    componentRef.setInput('combat', true);
    componentRef.setInput('showStats', this.isFullReveal);
    componentRef.setInput('redacted', !this.isFullReveal);
    componentRef.setInput('initialExpanded', true);
    componentRef.setInput('talentClasses', this.talentClasses);
    componentRef.setInput('itemClasses', this.itemClasses);
    componentRef.changeDetectorRef.detectChanges();
  }

  private closeOverlay(): void {
    this.overlayRef?.dispose();
    this.overlayRef = null;
  }

  private openDialog(): void {
    this.dialog.open<CharacterDetailsDialogComponent, CharacterDetailsDialogData>(CharacterDetailsDialogComponent, {
      data: {
        player: this.enemy,
        showStats: this.isFullReveal,
        redacted: !this.isFullReveal,
        talentClasses: this.talentClasses,
        itemClasses: this.itemClasses,
      },
      maxWidth: '95vw',
      autoFocus: false,
    });
  }

  ngOnDestroy(): void {
    this.closeOverlay();
  }
}
