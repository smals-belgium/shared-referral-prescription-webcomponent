import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

export interface ConfirmDialogData {
  titleLabel?: string;
  messageLabel?: string;
  cancelLabel?: string;
  okLabel?: string;
  params?: any;
}

@Component({
  standalone: true,
  selector: 'app-confirm-dialog',
  templateUrl: './confirm.dialog.html',
  styleUrls: ['./confirm.dialog.scss'],
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    TranslateModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfirmDialog {

  titleLabel?: string;
  messageLabel?: string;
  cancelLabel?: string;
  okLabel?: string;
  params: any;

  constructor(
    private dialogRef: MatDialogRef<ConfirmDialog, boolean>,
    @Inject(MAT_DIALOG_DATA) private data: ConfirmDialogData
  ) {
    this.titleLabel = this.data.titleLabel;
    this.messageLabel = this.data.messageLabel;
    this.cancelLabel = this.data.cancelLabel;
    this.okLabel = this.data.okLabel;
    this.params = this.data.params;
  }

  confirm() {
    this.dialogRef.close(true);
  }
}
