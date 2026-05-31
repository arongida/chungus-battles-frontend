import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CharacterDetailsService {
  public showTalentPicker = signal<boolean>(false);
}
