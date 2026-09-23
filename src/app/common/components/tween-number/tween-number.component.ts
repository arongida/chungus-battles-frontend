import { Component, effect, ElementRef, inject, input, OnDestroy, PLATFORM_ID, signal, untracked } from '@angular/core';
import { DecimalPipe, isPlatformBrowser } from '@angular/common';

/** Displays a number that counts toward each new value instead of jumping, and briefly tags
 *  the host with `tween-up` / `tween-down` so callers can style a pulse (see `.tween-up` in
 *  styles.scss). The first value renders immediately — no count-up from zero on load. */
@Component({
  selector: 'app-tween-number',
  standalone: true,
  imports: [DecimalPipe],
  template: `{{ display() | number: format() }}`,
})
export class TweenNumberComponent implements OnDestroy {
  value = input.required<number>();
  format = input('1.0-0');
  durationMs = input(350);

  display = signal(0);

  private readonly host = inject(ElementRef).nativeElement as HTMLElement;
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private initialized = false;
  private frame = 0;
  private pulseTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    effect(() => {
      const target = this.value() ?? 0;
      untracked(() => this.animateTo(target));
    });
  }

  private animateTo(target: number): void {
    const from = this.display();
    if (!this.initialized || !this.isBrowser || from === target) {
      this.initialized = true;
      this.display.set(target);
      return;
    }
    this.pulse(target > from ? 'tween-up' : 'tween-down');
    cancelAnimationFrame(this.frame);
    const start = performance.now();
    const duration = this.durationMs();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      this.display.set(t < 1 ? from + (target - from) * eased : target);
      if (t < 1) this.frame = requestAnimationFrame(step);
    };
    this.frame = requestAnimationFrame(step);
  }

  private pulse(cls: 'tween-up' | 'tween-down'): void {
    this.host.classList.remove('tween-up', 'tween-down');
    void this.host.offsetWidth;
    this.host.classList.add(cls);
    clearTimeout(this.pulseTimer);
    this.pulseTimer = setTimeout(() => this.host.classList.remove(cls), 400);
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.frame);
    clearTimeout(this.pulseTimer);
  }
}
