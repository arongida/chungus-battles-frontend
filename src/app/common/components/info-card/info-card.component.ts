import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { InfoContent } from '../../models/info-content';

@Component({
  selector: 'app-info-card',
  standalone: true,
  imports: [NgClass, MatIconModule],
  templateUrl: './info-card.component.html',
  styleUrl: './info-card.component.scss',
})
export class InfoCardComponent {
  @Input({ required: true }) content!: InfoContent;
}
