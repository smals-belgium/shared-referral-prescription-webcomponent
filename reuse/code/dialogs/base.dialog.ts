import { MatDialogRef } from '@angular/material/dialog';
import { ErrorCard } from '../interfaces/error-card.interface';

export abstract class BaseDialog<T = any> {
  errorCard: ErrorCard = {
    show: false,
    message: '',
    errorResponse: undefined
  };

  constructor(protected dialogRef: MatDialogRef<T>) {}

  closeDialog(data: any): void {
    this.dialogRef.close(data);
  }

  showErrorCard(message: string, errorResponse?: any) {
    this.errorCard = { show: true, message, errorResponse };
  }

  closeErrorCard() {
    this.errorCard = { show: false, message: '', errorResponse: undefined };
  }
}
