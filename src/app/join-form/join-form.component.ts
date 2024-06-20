import { Component } from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DraftService } from '../draft/services/draft.service';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { join } from 'node:path/posix';

@Component({
  selector: 'app-join-form',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './join-form.component.html',
  styleUrl: './join-form.component.css',
})
export class JoinFormComponent {
  nameControl = new FormControl('');
  avatarOptions = [
    'https://chungus-battles.b-cdn.net/chungus-battles-assets/Portrait_ID_0_Placeholder.png',
    'https://chungus-battles.b-cdn.net/chungus-battles-assets/warrior_01.png',
    'https://chungus-battles.b-cdn.net/chungus-battles-assets/thief_01.png',
  ];
  avatarSelected = this.avatarOptions[1];
  loading = false;

  constructor(
    public draftService: DraftService,
    private snackBar: MatSnackBar
  ) {}

  onNextButton() {
    const currentIndex = this.avatarOptions.indexOf(this.avatarSelected);
    const nextIndex = (currentIndex + 1) % this.avatarOptions.length;
    this.avatarSelected = this.avatarOptions[nextIndex];
  }

  onPrevButton() {
    const currentIndex = this.avatarOptions.indexOf(this.avatarSelected);
    const prevIndex =
      (currentIndex - 1 + this.avatarOptions.length) %
      this.avatarOptions.length;
    this.avatarSelected = this.avatarOptions[prevIndex];
  }

  async onFormSubmit() {
    this.loading = true;
    const joinResult = await this.draftService.joinOrCreate(
      this.nameControl.value!,
      undefined,
      this.avatarSelected
    );
    if (joinResult) {
      this.snackBar.open(joinResult, 'Close');
    }
    this.loading = false;
  }
}
