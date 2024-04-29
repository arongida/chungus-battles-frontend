import { Component, Input} from '@angular/core';
import { Item } from '../../../models/colyseus-schema/ItemSchema';
import { MatCardModule } from '@angular/material/card';
import { DraftService } from '../../services/draft.service';
import { NgFor } from '@angular/common';
import { MatButtonModule } from '@angular/material/button'
import { SlicePipe } from '@angular/common';
import { MatTooltipModule} from '@angular/material/tooltip';

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [MatCardModule, NgFor, MatButtonModule, SlicePipe, MatTooltipModule],
  templateUrl: './shop.component.html',
  styleUrl: './shop.component.css'
})
export class ShopComponent {

  constructor(public draftService: DraftService) {
    this.shop = [] as Item[];
  }

  @Input({ required: true }) shop: Item[];
}
