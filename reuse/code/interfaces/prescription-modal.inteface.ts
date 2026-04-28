import { LoadingStatus } from '@reuse/code/interfaces/data-state.interface';
import { HttpErrorResponse } from '@angular/common/http';

export interface PrescriptionModelStatus {
  prescriptionTrackById: number;
  state: LoadingStatus;
  error?: HttpErrorResponse;
  success?: string;
}
