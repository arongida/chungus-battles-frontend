import { Component, Inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { InfoCardComponent } from '../info-card/info-card.component';
import { InfoContent } from '../../models/info-content';

export interface HintModalResult {
  dontShowAgain: boolean;
}

export interface HintModalData {
  content: InfoContent;
  /** Whether to offer the "Don't show again" checkbox. Omitted for on-demand opens (e.g. a help-icon tap), which re-show every time regardless of this choice. */
  showRemember: boolean;
}

/**
 * One-time hint modal shown on touch devices in place of the hover-driven info-box panel.
 * Renders the same InfoContent as the panel (via InfoCardComponent) plus an optional "don't show
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
  readonly content: InfoContent;
  readonly showRemember: boolean;

  constructor(
    @Inject(MAT_DIALOG_DATA) data: HintModalData,
    private dialogRef: MatDialogRef<HintModalComponent, HintModalResult>,
  ) {
    this.content = data.content;
    this.showRemember = data.showRemember;
  }

  onDontShowAgainChange(event: MatCheckboxChange): void {
    this.dontShowAgain.set(event.checked);
  }

  ok(): void {
    this.dialogRef.close({ dontShowAgain: this.dontShowAgain() });
  }
}
