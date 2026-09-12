import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

/** "Art by pkart" credit link, shared by the join screen and the end screen so both always
 *  point at the same page and stay visually in sync. */
@Component({
  selector: 'app-art-credit',
  standalone: true,
  imports: [NgClass],
  templateUrl: './art-credit.component.html',
  styleUrl: './art-credit.component.scss',
})
export class ArtCreditComponent {
  /** Extra classes for the inner text (e.g. `text-white` on the end screen's dark backdrop). */
  @Input() extraClass = '';

  readonly url = 'https://cara.app/pkart';
}
