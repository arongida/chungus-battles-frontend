import { Component, computed, ElementRef, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { DOCUMENT, isPlatformBrowser, NgClass } from '@angular/common';
import { InfoBoxService } from '../../services/info-box.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-info-box',
  standalone: true,
  imports: [NgClass, MatIconModule],
  templateUrl: './info-box.component.html',
  styleUrl: './info-box.component.scss',
})
export class InfoBoxComponent implements OnInit {
  private infoBoxService = inject(InfoBoxService);
  private el = inject(ElementRef);
  private document = inject(DOCUMENT);
  private platformId = inject(PLATFORM_ID);

  isVisible = this.infoBoxService.isVisible;
  displayContent = computed(() =>
    this.infoBoxService.currentContent() ?? this.infoBoxService.pageDefault()
  );

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.document.body.appendChild(this.el.nativeElement);
    }
  }
}
