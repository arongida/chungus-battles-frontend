import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface ConfirmDialogData {
  icon: string;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  /** Use the red stroked "danger" look for the confirm button (forfeit/abandon) instead of
   *  the standard amber gradient (reset-tutorial/disable-hints). */
  confirmDanger?: boolean;
}

/**
 * Generic yes/no confirmation, opened via MatDialog so it renders in the CDK overlay
 * (z-index: 800) instead of being capped by whatever stacking context the opener lives in —
 * see draft-toolbar.component.ts for the forfeit/abandon/reset-tutorial/disable-hints callers.
 * Resolves `true` on confirm, `false` on cancel/backdrop-dismiss.
 */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss',
})
export class ConfirmDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData,
    private dialogRef: MatDialogRef<ConfirmDialogComponent, boolean>,
  ) { }

  cancel(): void {
    this.dialogRef.close(false);
  }

  confirm(): void {
    this.dialogRef.close(true);
  }
}
