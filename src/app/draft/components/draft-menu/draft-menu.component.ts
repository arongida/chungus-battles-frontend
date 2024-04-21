import { Component } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { DraftService } from '../../services/draft.service';
@Component({
  selector: 'app-draft-menu',
  standalone: true,
  imports: [MatButton],
  templateUrl: './draft-menu.component.html',
  styleUrl: './draft-menu.component.css'
})
export class DraftMenuComponent {
  constructor(public draftService: DraftService) { }
}
