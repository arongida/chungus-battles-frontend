import {
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  Renderer2,
  AfterViewInit,
  PLATFORM_ID,
  Inject,
  OnInit,
} from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { DraftService } from '../draft/services/draft.service';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { isPlatformBrowser } from '@angular/common';
import { itemPictures } from '../common/item-image-links';
import { ItemTrackingService } from '../common/services/item-tracking.service';
import { MusicOptions, SoundOptions, SoundsService } from '../common/services/sounds.service';
import { InfoBoxService } from '../common/services/info-box.service';
import { InfoEntry } from '../common/models/info-content';

@Component({
  selector: 'app-join-form',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './join-form.component.html',
  styleUrl: './join-form.component.scss',
})
export class JoinFormComponent implements AfterViewInit, OnDestroy, OnInit {
  nameControl = new FormControl('', Validators.compose([Validators.maxLength(20), Validators.required]));
  avatarOptions = [
    'assets/warrior_01.png',
    'assets/thief_01.png',
    'assets/merchant_01.png',
  ];
  fallingItems = itemPictures;
  avatarSelected = this.avatarOptions[1];

  private readonly classInfoEntries: InfoEntry[] = [
    { icon: '⚔️', label: 'Warrior - Value', text: '4 lives instead of 3 - more chances.' },
    { icon: '🗡️', label: 'Thief - Tempo', text: 'Starts at level 2 with an extra talent point and tier-2 shop access — snowballs fast.' },
    { icon: '💰', label: 'Merchant - Flexibility', text: '+3 income — refresh more, build any direction.' },
    { icon: '💡', label: 'Tip', text: 'Your class picks a starting bonus and weapon — items can take you any direction.' },
  ];
  loading = false;
  intervalId: any;
  @ViewChild('fallingItemsContainer', { static: false })
  fallingItemsContainer!: ElementRef<HTMLDivElement>;
  muted = false;

  constructor(
    public draftService: DraftService,
    private snackBar: MatSnackBar,
    private renderer: Renderer2,
    private itemTrackingService: ItemTrackingService,
    private soundsService: SoundsService,
    private infoBoxService: InfoBoxService,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  /** On touch, hints stay enabled at all times (see toggleInfoBox), so the highlight would
   *  always be on and falsely imply an active hover-hint mode that doesn't exist there. */
  infoBoxHighlighted(): boolean {
    return !this.infoBoxService.isTouch && this.infoBoxService.isVisible();
  }

  ngOnInit() {
    this.soundsService.playMusic(MusicOptions.DRAFT);
    this.infoBoxService.clearContent();
    this.infoBoxService.setPageDefault({
      id: 'choose-character',
      title: 'Choose Your Character',
      entries: this.classInfoEntries,
    });
  }

  ngAfterViewInit(): void {

    if (isPlatformBrowser(this.platformId)) {
      // Only run the animation interval in the browser
      this.intervalId = setInterval(() => {
        this.triggerShowFallingItem(this.fallingItems[Math.floor(Math.random() * this.fallingItems.length)]);
      }, 1000);
    }
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.infoBoxService.clearPageDefault();
    this.infoBoxService.clearContent();
  }

  toggleInfoBox() {
    // The hint side panel never renders on touch, so the question-mark button there
    // instead opens the page's hint as a modal on demand.
    if (this.infoBoxService.isTouch) {
      const content = this.infoBoxService.pageDefault();
      if (content) this.infoBoxService.showHintModal(content);
      return;
    }
    this.infoBoxService.toggle();
  }

  onNextButton() {
    const currentIndex = this.avatarOptions.indexOf(this.avatarSelected);
    const nextIndex = (currentIndex + 1) % this.avatarOptions.length;
    this.avatarSelected = this.avatarOptions[nextIndex];
  }

  onPrevButton() {
    const currentIndex = this.avatarOptions.indexOf(this.avatarSelected);
    const prevIndex = (currentIndex - 1 + this.avatarOptions.length) % this.avatarOptions.length;
    this.avatarSelected = this.avatarOptions[prevIndex];
  }

  getInputErrorMessage() {
    if (this.nameControl.hasError('required')) {
      return 'Name is required!';
    }
    return this.nameControl.hasError('maxlength') ? 'Name is too long!' : '';
  }

  async onFormSubmit() {

    if (this.nameControl.invalid) {
      const errorMessage = this.getInputErrorMessage();
      this.snackBar.open(errorMessage, 'Close', {
        duration: 3000,
        panelClass: 'chungus-snackbar',
      });
      return;
    }

    this.soundsService.playSound(SoundOptions.CLICK);
    this.loading = true;
    this.itemTrackingService.resetTrackedCollections();
    const joinResult = await this.draftService.joinOrCreate(this.nameControl.value!, undefined, this.avatarSelected);
    if (joinResult) {
      this.snackBar.open(joinResult, 'Close', { panelClass: 'chungus-snackbar' });
    }
    this.loading = false;
  }

  triggerShowFallingItem(itemPicture: string) {
    if (this.fallingItemsContainer) {
      // Create the img element using Renderer2
      const itemImg = this.renderer.createElement('img');
      this.renderer.setAttribute(itemImg, 'src', itemPicture);
      this.renderer.setStyle(itemImg, 'scale', '0.5');
      this.renderer.addClass(itemImg, 'animate-fall');
      this.renderer.addClass(itemImg, 'fixed');
      this.renderer.setStyle(itemImg, 'left', `${Math.random() * 100}%`);
      this.renderer.setStyle(itemImg, 'z-index', '-1');

      // Append the img element to the container
      this.renderer.appendChild(this.fallingItemsContainer.nativeElement, itemImg);

      // Remove the img element after 5 seconds
      setTimeout(() => {
        this.renderer.removeChild(this.fallingItemsContainer.nativeElement, itemImg);
      }, 6000);
    }
  }

  switchMute() {
    this.soundsService.setVolume(this.muted ? 0.1 : 0);
    this.muted = !this.muted;
  }
}
