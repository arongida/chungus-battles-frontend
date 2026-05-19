import { AfterViewInit, Directive, ElementRef, inject, Input, OnDestroy, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Directive({
  selector: '[appDraggablePanel]',
  standalone: true,
})
export class DraggablePanelDirective implements AfterViewInit, OnDestroy {
  @Input() dragHandleSelector?: string;

  private readonly el = inject(ElementRef);
  private readonly platformId = inject(PLATFORM_ID);

  private handle?: HTMLElement;
  private isDragging = false;
  private startX = 0;
  private startY = 0;
  private startLeft = 0;
  private startTop = 0;

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const panel = this.el.nativeElement as HTMLElement;
    this.handle = (this.dragHandleSelector
      ? panel.querySelector<HTMLElement>(this.dragHandleSelector)
      : panel) ?? panel;

    this.handle.style.cursor = 'grab';
    this.handle.addEventListener('mousedown', this.onMouseDown);
    this.handle.addEventListener('touchstart', this.onTouchStart, { passive: false });
  }

  ngOnDestroy(): void {
    if (this.handle) {
      this.handle.removeEventListener('mousedown', this.onMouseDown);
      this.handle.removeEventListener('touchstart', this.onTouchStart);
    }
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
    document.removeEventListener('touchmove', this.onTouchMove);
    document.removeEventListener('touchend', this.onTouchEnd);
  }

  private onMouseDown = (e: MouseEvent): void => {
    if (e.button !== 0) return;
    e.preventDefault();
    this.beginDrag(e.clientX, e.clientY);
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
  };

  private onMouseMove = (e: MouseEvent): void => this.moveDrag(e.clientX, e.clientY);

  private onMouseUp = (): void => {
    this.endDrag();
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
  };

  private onTouchStart = (e: TouchEvent): void => {
    e.preventDefault();
    const t = e.touches[0];
    this.beginDrag(t.clientX, t.clientY);
    document.addEventListener('touchmove', this.onTouchMove, { passive: false });
    document.addEventListener('touchend', this.onTouchEnd);
  };

  private onTouchMove = (e: TouchEvent): void => {
    e.preventDefault();
    const t = e.touches[0];
    this.moveDrag(t.clientX, t.clientY);
  };

  private onTouchEnd = (): void => {
    this.endDrag();
    document.removeEventListener('touchmove', this.onTouchMove);
    document.removeEventListener('touchend', this.onTouchEnd);
  };

  private beginDrag(x: number, y: number): void {
    const panel = this.el.nativeElement as HTMLElement;
    const rect = panel.getBoundingClientRect();

    panel.style.position = 'fixed';
    panel.style.left = `${rect.left}px`;
    panel.style.top = `${rect.top}px`;
    panel.style.transform = 'none'; // override any class-based transforms (e.g. translateY(-50%))
    panel.style.bottom = '';
    panel.style.right = '';

    this.isDragging = true;
    this.startX = x;
    this.startY = y;
    this.startLeft = rect.left;
    this.startTop = rect.top;

    document.body.style.userSelect = 'none';
    if (this.handle) this.handle.style.cursor = 'grabbing';
  }

  private moveDrag(x: number, y: number): void {
    if (!this.isDragging) return;
    const panel = this.el.nativeElement as HTMLElement;
    const newLeft = Math.max(0, Math.min(window.innerWidth - panel.offsetWidth, this.startLeft + (x - this.startX)));
    const newTop = Math.max(0, Math.min(window.innerHeight - panel.offsetHeight, this.startTop + (y - this.startY)));
    panel.style.left = `${newLeft}px`;
    panel.style.top = `${newTop}px`;
  }

  private endDrag(): void {
    this.isDragging = false;
    document.body.style.userSelect = '';
    if (this.handle) this.handle.style.cursor = 'grab';
  }
}
