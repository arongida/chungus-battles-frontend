import { Component, Input, computed } from '@angular/core';
import { Item } from '../../../models/colyseus-schema/ItemSchema';
import { MatCardModule } from '@angular/material/card';
import { DraftService } from '../../services/draft.service';
import { TitleCasePipe, NgClass, DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CdkDrag, CdkDragDrop, CdkDragExit, CdkDropList, DragDropModule } from '@angular/cdk/drag-drop';
import { Player } from '../../../models/colyseus-schema/PlayerSchema';
import { ItemTrackingService } from '../../../common/services/item-tracking.service';
import { SoundOptions, SoundsService } from '../../../common/services/sounds.service';
import { ItemCardComponent } from '../../../common/item-card/item-card.component';
import { CharacterDetailsService } from '../../../common/services/character-details.service';

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [
    NgClass,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    CdkDrag,
    CdkDropList,
    DragDropModule,
    ItemCardComponent,
  ],
  templateUrl: './shop.component.html',
  styleUrl: './shop.component.scss',
})
export class ShopComponent {
  hoverShopRefresh = false;
  hoverBuyXp = false;
  dragPosition = { x: 0, y: 0 };
  draggingCard = false;
  dragIndex = 0;
  previewBuyItem = false;
  tempCard: HTMLElement | null = null;
  trackedCollectionIds = computed(() => this.itemTrackingService.trackedCollectionIds());

  constructor(
    public draftService: DraftService,
    private itemTrackingService: ItemTrackingService,
    private soundsService: SoundsService,
    private characterDetailsService: CharacterDetailsService
  ) {
    this.shop = [] as Item[];
    this.player = new Player();
  }

  @Input({ required: true }) shop: Item[];
  @Input({ required: true }) player: Player;
  @Input({ required: false }) showCharacterDetails: boolean = false;

  onMouseEnterItem(item: Item) {
    if (this.draggingCard) return;
    item.showDetails = true;
    item.imageCache = item.image;
    item.image = `https://chungus-battles.b-cdn.net/chungus-battles-assets/level_${item.tier}_glow.png`;
  }

  onMouseLeaveItem(item: Item) {
    if (this.draggingCard) return;
    item.showDetails = false;
    item.image = item.imageCache ? item.imageCache : item.image;
  }

  getItemImage(item: Item) {
    return item.image ? item.image : 'https://chungus-battles.b-cdn.net/chungus-battles-assets/Item_ID_0_Empty.png';
  }

  cardDragStarted(item: Item) {
    this.draggingCard = true;
    this.dragIndex = this.shop.indexOf(item);
  }

  onDrop(event: CdkDragDrop<any[]>) {
    this.draggingCard = false;
    // Get the dragged item from the event
    const item = this.shop[event.previousIndex];
    // Check if the player has enough gold and the item is not sold
    if (this.player.gold >= item.price && !item.sold) {
      this.buyItem(item);
    }
  }

  buyItem(item: Item) {
    this.draftService.sendMessage('buy', {
      itemId: item.itemId,
    });
    this.soundsService.playSound(SoundOptions.BUY);
    this.previewBuyItem = false;
    this.tempCard?.remove();
    this.tempCard = null;
    this.characterDetailsService.showCharacterDetails.set(true);
  }

  resetDrag(item: Item) {
    this.draggingCard = false;
    this.dragPosition = { x: 0, y: 0 };
    this.onMouseLeaveItem(item);
    this.tempCard?.remove();
    this.tempCard = null;
  }

  onDragExited(event: CdkDragExit, cardElementRef: HTMLElement, gridRef: HTMLElement) {
    if (this.tempCard) return;
    console.log('onDragExited', event, cardElementRef);
    //copy the card element to the original position
    const cardElement = cardElementRef.childNodes[0].cloneNode(true);
    //insert copy of the card element to the original position
    console.log('inserting at index ', this.dragIndex);
    console.log('gridRef.childNodes', gridRef.childNodes);
    gridRef.insertBefore(cardElement, gridRef.childNodes[this.dragIndex * 2]);
    this.tempCard = cardElement as HTMLElement;
  }

  onDragExitFromBuyZone() {
    this.previewBuyItem = false;
    this.tempCard?.remove();
    this.tempCard = null;
  }

  preventDropBack(): boolean {
    return false;
  }


  isCardHighlighted(item: Item): boolean {
    const isOwned = this.player.getOwnedCountForItem(item) > 0;
    const isTracked = item.itemCollections.some((collectionId) => this.trackedCollectionIds().includes(collectionId));
    return isTracked && !isOwned;
  }
}
