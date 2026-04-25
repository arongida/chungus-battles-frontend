import { Component, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { InfoBoxService } from '../../services/info-box.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-info-box',
  standalone: true,
  imports: [NgClass, MatIconModule],
  templateUrl: './info-box.component.html',
  styleUrl: './info-box.component.scss',
})
export class InfoBoxComponent {
  private infoBoxService = inject(InfoBoxService);

  isVisible = this.infoBoxService.isVisible;
  currentContent = this.infoBoxService.currentContent;
}
