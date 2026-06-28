import { AfterViewChecked, Component, ElementRef, Input, PLATFORM_ID, ViewChild, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CombatLogEntry } from '../../../models/types/CombatLogEntry';
import { Player } from '../../../models/colyseus-schema/PlayerSchema';
import { CombatLogHoverCardDirective } from '../../../common/directives/combat-log-hover-card.directive';

@Component({
  selector: 'app-combat-log',
  standalone: true,
  imports: [CombatLogHoverCardDirective],
  templateUrl: './combat-log.component.html',
  styleUrl: './combat-log.component.scss',
})
export class CombatLogComponent implements AfterViewChecked {
  @Input({ required: true }) entries: CombatLogEntry[] = [];
  @Input({ required: true }) player!: Player;
  @Input({ required: true }) enemy!: Player;

  collapsed = signal(true);

  @ViewChild('scroll') private scrollEl!: ElementRef<HTMLDivElement>;

  private readonly el = inject(ElementRef);
  private readonly platformId = inject(PLATFORM_ID);

  private lastLength = 0;

  constructor() {
    effect(() => {
      if (!isPlatformBrowser(this.platformId)) return;
      if (this.collapsed()) {
        // On collapse, remove any inline position so the CSS default (bottom-right) takes over.
        this.snapToDefaultPosition();
      } else {
        // After expanding, wait one frame for the full height to render, then clamp.
        requestAnimationFrame(() => this.clampExpandedToViewport());
      }
    });
  }

  ngAfterViewChecked() {
    if (this.entries.length !== this.lastLength) {
      this.lastLength = this.entries.length;
      this.scrollToBottom();
    }
  }

  private scrollToBottom() {
    try {
      this.scrollEl.nativeElement.scrollTop = this.scrollEl.nativeElement.scrollHeight;
    } catch { /* noop during SSR */ }
  }

  /** Clears all inline position styles so the CSS class default (bottom-right) takes over. */
  private snapToDefaultPosition(): void {
    const wrapper = (this.el.nativeElement as HTMLElement).parentElement;
    if (!wrapper) return;
    wrapper.style.top = '';
    wrapper.style.left = '';
    wrapper.style.bottom = '';
    wrapper.style.right = '';
    wrapper.style.transform = '';
  }

  /** When the panel has been dragged (style.top set), ensure expanding it doesn't push
   *  it below the viewport bottom. CSS-positioned panels anchor by `bottom` and grow
   *  upward, so no adjustment is needed there. */
  private clampExpandedToViewport(): void {
    const wrapper = (this.el.nativeElement as HTMLElement).parentElement;
    if (!wrapper || !wrapper.style.top) return;
    const top = parseFloat(wrapper.style.top);
    const height = wrapper.offsetHeight;
    const maxTop = window.innerHeight - height - 4;
    if (top > maxTop) {
      wrapper.style.top = `${Math.max(0, maxTop)}px`;
    }
  }
}
