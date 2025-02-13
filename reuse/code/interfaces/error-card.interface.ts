import { HttpErrorResponse } from '@angular/common/http';

export interface ErrorCard {
  show: boolean;
  message: string;
  translationOptions?: any
  errorResponse?: HttpErrorResponse;
  // type?: 'error' | 'warning' | 'info';
}
