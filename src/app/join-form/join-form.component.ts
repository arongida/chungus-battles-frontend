import { Component } from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button'
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DraftService } from '../draft.service';
import { MatCardModule } from '@angular/material/card';


@Component({
  selector: 'app-join-form',
  standalone: true,
  imports: [MatFormFieldModule, MatInputModule, MatButtonModule, ReactiveFormsModule, MatCardModule],
  templateUrl: './join-form.component.html',
  styleUrl: './join-form.component.css'
})
export class JoinFormComponent {
  nameControl = new FormControl('');

  constructor(public draftService: DraftService) { }
}
