import {
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  Renderer2,
  AfterViewInit,
  PLATFORM_ID,
  Inject,
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
import { itemPictures } from './item-image-links';
import { ItemTrackingService } from '../common/services/item-tracking.service';

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
export class JoinFormComponent implements AfterViewInit, OnDestroy {
  nameControl = new FormControl(
    '',
    Validators.compose([Validators.maxLength(20), Validators.required])
  );
  avatarOptions = [
    'https://chungus-battles.b-cdn.net/chungus-battles-assets/warrior_01.png',
    'https://chungus-battles.b-cdn.net/chungus-battles-assets/thief_01.png',
    'https://chungus-battles.b-cdn.net/chungus-battles-assets/merchant_01.png'
  ];
  fallingItems = itemPictures;
  avatarSelected = this.avatarOptions[1];
  loading = false;
  intervalId: any;
  @ViewChild('fallingItemsContainer', { static: false })
  fallingItemsContainer!: ElementRef<HTMLDivElement>;

  constructor(
    public draftService: DraftService,
    private snackBar: MatSnackBar,
    private renderer: Renderer2,
    private itemTrackingService: ItemTrackingService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Only run the animation interval in the browser
      this.intervalId = setInterval(() => {
        this.triggerShowFallingItem(
          this.fallingItems[
            Math.floor(Math.random() * this.fallingItems.length)
          ]
        );
      }, 1000);
    }
  }

  ngOnDestroy(): void {
    // Clear the interval when the component is destroyed
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  onNextButton() {
    const currentIndex = this.avatarOptions.indexOf(this.avatarSelected);
    const nextIndex = (currentIndex + 1) % this.avatarOptions.length;
    this.avatarSelected = this.avatarOptions[nextIndex];
  }

  onPrevButton() {
    const currentIndex = this.avatarOptions.indexOf(this.avatarSelected);
    const prevIndex =
      (currentIndex - 1 + this.avatarOptions.length) %
      this.avatarOptions.length;
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
      });
      return;
    }

    this.loading = true;
    this.itemTrackingService.resetTrackedCollections();
    const joinResult = await this.draftService.joinOrCreate(
      this.nameControl.value!,
      undefined,
      this.avatarSelected
    );
    if (joinResult) {
      this.snackBar.open(joinResult, 'Close');
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
      this.renderer.appendChild(
        this.fallingItemsContainer.nativeElement,
        itemImg
      );

      // Remove the img element after 5 seconds
      setTimeout(() => {
        this.renderer.removeChild(
          this.fallingItemsContainer.nativeElement,
          itemImg
        );
      }, 6000);
    }
  }
}
