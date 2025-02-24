import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CharacterDetailsService {
  public showCharacterDetails = signal<boolean>(false);

  toggleCharacterDetails() {
    this.showCharacterDetails.set(!this.showCharacterDetails());
  }

  closeCharacterDetails() {
    this.showCharacterDetails.set(false);
  }

}
