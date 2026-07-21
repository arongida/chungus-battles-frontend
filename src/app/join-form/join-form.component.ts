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
  signal,
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
import { MusicOptions, SoundsService } from '../common/services/sounds.service';
import { InfoBoxService } from '../common/services/info-box.service';
import { InfoEntry } from '../common/models/info-content';
import { SeasonsService } from '../common/services/seasons.service';
import { RouterLink } from '@angular/router';

interface ClassOption {
  avatar: string;
  icon: string;
  name: string;
  tagline: string;
  effect: string;
}

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
    RouterLink,
  ],
  templateUrl: './join-form.component.html',
  styleUrl: './join-form.component.scss',
})
export class JoinFormComponent implements AfterViewInit, OnDestroy, OnInit {
  nameControl = new FormControl('', Validators.compose([Validators.maxLength(20), Validators.required]));

  private readonly classOptions: ClassOption[] = [
    { avatar: 'assets/warrior_01.png', icon: '⚔️', name: 'Warrior', tagline: 'Value', effect: '4 lives instead of 3 — more chances. Every level: +40 HP, +6 strength' },
    { avatar: 'assets/thief_01.png', icon: '🗡️', name: 'Rogue', tagline: 'Tempo', effect: 'Starts at lvl 2, extra talent + tier-2 shop. Every level: +10 HP, +20% attack speed, +10 dodge' },
    { avatar: 'assets/merchant_01.png', icon: '💰', name: 'Merchant', tagline: 'Flexibility', effect: '+3 income. Every level: +20 HP, +2 income' },
  ];
  fallingItems = itemPictures;
  selectedIndex = signal(1);

  get selectedClass(): ClassOption {
    return this.classOptions[this.selectedIndex()];
  }

  get avatarSelected(): string {
    return this.selectedClass.avatar;
  }

  loading = false;
  currentSeason = signal(0);
  currentSeasonName = signal('');
  intervalId: any;
  @ViewChild('fallingItemsContainer', { static: false })
  fallingItemsContainer!: ElementRef<HTMLDivElement>;

  get volumeIcon(): string {
    return this.soundsService.volumeIcon;
  }

  constructor(
    public draftService: DraftService,
    private snackBar: MatSnackBar,
    private renderer: Renderer2,
    private itemTrackingService: ItemTrackingService,
    private soundsService: SoundsService,
    private infoBoxService: InfoBoxService,
    private seasonsService: SeasonsService,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  /** On touch, hints stay enabled at all times (see toggleInfoBox), so the highlight would
   *  always be on and falsely imply an active hover-hint mode that doesn't exist there. */
  infoBoxHighlighted(): boolean {
    return !this.infoBoxService.isTouch && this.infoBoxService.isVisible();
  }

  ngOnInit() {
    this.seasonsService.getSeasons().then(data => {
      this.currentSeason.set(data.currentSeason);
      this.currentSeasonName.set(data.seasons.find(s => s.number === data.currentSeason)?.name ?? '');
    });
    this.soundsService.playMusic(MusicOptions.DRAFT);
    this.infoBoxService.clearContent();
    const entries: InfoEntry[] = [
      ...this.classOptions.map(c => ({ icon: c.icon, label: `${c.name} - ${c.tagline}`, text: c.effect })),
      { icon: '💡', label: 'Tip', text: 'Your class picks a starting bonus and weapon — items can take you any direction.' },
    ];
    this.infoBoxService.setPageDefault({
      id: 'choose-character',
      title: 'Choose Your Character',
      entries,
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
    this.selectedIndex.set((this.selectedIndex() + 1) % this.classOptions.length);
  }

  onPrevButton() {
    this.selectedIndex.set((this.selectedIndex() - 1 + this.classOptions.length) % this.classOptions.length);
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

  cycleVolume() {
    this.soundsService.cycleVolume();
  }
}
