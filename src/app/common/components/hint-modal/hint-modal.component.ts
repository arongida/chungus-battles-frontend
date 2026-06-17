import { Component, Inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { InfoCardComponent } from '../info-card/info-card.component';
import { InfoContent } from '../../models/info-content';

export interface HintModalResult {
  dontShowAgain: boolean;
}

/**
 * One-time hint modal shown on touch devices in place of the hover-driven info-box panel.
 * Renders the same InfoContent as the panel (via InfoCardComponent) plus a "don't show
 * again" checkbox; InfoBoxService decides whether to ever open this and persists the result.
 */
@Component({
  selector: 'app-hint-modal',
  standalone: true,
  imports: [MatDialogModule, MatCheckboxModule, MatButtonModule, InfoCardComponent],
  templateUrl: './hint-modal.component.html',
  styleUrl: './hint-modal.component.scss',
})
export class HintModalComponent {
  readonly dontShowAgain = signal(true);

  constructor(
    @Inject(MAT_DIALOG_DATA) public content: InfoContent,
    private dialogRef: MatDialogRef<HintModalComponent, HintModalResult>,
  ) {}

  onDontShowAgainChange(event: MatCheckboxChange): void {
    this.dontShowAgain.set(event.checked);
  }

  ok(): void {
    this.dialogRef.close({ dontShowAgain: this.dontShowAgain() });
  }
}
