import { MatDialogRef } from '@angular/material/dialog';
import { ErrorCard } from '@reuse/code/interfaces/error-card.interface';
import { HttpErrorResponse } from '@angular/common/http';

export abstract class BaseDialog<T = unknown> {
  errorCard: ErrorCard = {
    show: false,
    message: '',
    errorResponse: undefined,
  };

  constructor(protected dialogRef: MatDialogRef<T>) {}

  closeDialog(data: unknown): void {
    this.dialogRef.close(data);
  }

  showErrorCard(message: string, errorResponse?: HttpErrorResponse) {
    this.errorCard = { show: true, message, errorResponse };
  }

  closeErrorCard() {
    this.errorCard = { show: false, message: '', errorResponse: undefined };
  }
}
