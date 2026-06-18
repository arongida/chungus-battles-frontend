import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CharacterDetailsService {
  public showTalentPicker = signal<boolean>(false);

  /** True when an item has been bought since the panel was last opened — drives the
   * "open me" glow on the minimized character panel in the shop. */
  public hasUnseenPurchase = signal<boolean>(false);

  notifyPurchase(): void {
    this.hasUnseenPurchase.set(true);
  }

  acknowledgePurchase(): void {
    this.hasUnseenPurchase.set(false);
  }
}
