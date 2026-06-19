import { Directive, HostListener, Input } from '@angular/core';
import { InfoBoxService } from '../services/info-box.service';
import { InfoContent } from '../models/info-content';

@Directive({
  selector: '[appInfoHint]',
  standalone: true,
})
export class InfoHintDirective {
  @Input('appInfoHint') infoHint!: InfoContent;
  /** When true, this element's own gateAction()/hintContent gating already controls the modal — skip the click-driven open here to avoid racing it. */
  @Input() gatesAction = false;

  constructor(private infoBoxService: InfoBoxService) {}

  @HostListener('mouseenter')
  onMouseEnter(): void {
    if (this.infoBoxService.isTouch) return;
    if (this.infoHint) {
      this.infoBoxService.setContent(this.infoHint);
    }
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    if (this.infoBoxService.isTouch) return;
    this.infoBoxService.clearContentDelayed();
  }

  // mouseenter is only synthesized on tap for elements with their own click handler
  // (eg. shop items) — plain informational elements (gold/xp/round-info) never get it,
  // so touch devices need an explicit tap trigger instead.
  @HostListener('click')
  onClick(): void {
    if (!this.infoBoxService.isTouch || this.gatesAction) return;
    if (this.infoHint) {
      this.infoBoxService.setContent(this.infoHint);
    }
  }
}
