import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';

export interface ToastOptions {
  interpolation: any;
}

@Injectable({providedIn: 'root'})
export class ToastService {

  constructor(
    private readonly snackBar: MatSnackBar,
    private readonly translate: TranslateService
  ) {
  }

  show(messageLabel: string, options?: ToastOptions): void {
    this.snackBar.open(this.translate.instant(messageLabel, options?.interpolation), 'X', { duration : 8000 });
  }

  showSomethingWentWrong(): void {
    this.show('common.somethingWentWrong');
  }

  showForbiddenAction(): void {
    this.show('common.forbiddenAction');
  }
}
