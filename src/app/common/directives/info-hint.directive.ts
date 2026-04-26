import { Directive, HostListener, Input } from '@angular/core';
import { InfoBoxService } from '../services/info-box.service';
import { InfoContent } from '../models/info-content';

@Directive({
  selector: '[appInfoHint]',
  standalone: true,
})
export class InfoHintDirective {
  @Input('appInfoHint') infoHint!: InfoContent;

  constructor(private infoBoxService: InfoBoxService) {}

  @HostListener('mouseenter')
  onMouseEnter(): void {
    if (this.infoHint) {
      this.infoBoxService.setContent(this.infoHint);
    }
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.infoBoxService.clearContentDelayed();
  }
}
