import { Component, HostListener, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { InfoBoxComponent } from './common/components/info-box/info-box.component';
import { SoundOptions, SoundsService } from './common/services/sounds.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, InfoBoxComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'chungus-battles-frontend';
  private readonly sounds = inject(SoundsService);

  /** Plays the click sound for every "brown button" (`.chungus-modal-btn` — modals, restart
   *  prompts, buy/equip cards, etc.) without wiring it into each component individually.
   *  Listens at the document level so it also catches buttons rendered into CDK overlays
   *  (e.g. the item hover-card popup), which live outside this component's own template.
   *  Buttons that already play a more specific sound (e.g. the shop's Buy button, which
   *  plays SoundOptions.BUY) opt out via the `.no-click-sound` class so it doesn't double up.
   *  Header icon buttons (mute, abandon, forfeit) use mat-icon-button instead of this class,
   *  so they're unaffected. Disabled buttons don't fire click events, so they're naturally
   *  excluded too. */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    const button = target?.closest('button.chungus-modal-btn');
    if (button && !button.classList.contains('no-click-sound')) {
      this.sounds.playSound(SoundOptions.CLICK);
    }
  }
}
