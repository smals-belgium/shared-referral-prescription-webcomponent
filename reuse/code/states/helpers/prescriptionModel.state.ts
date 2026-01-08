import { Injectable, signal } from '@angular/core';
import { LoadingStatus } from '@reuse/code/interfaces';
import { PrescriptionModelStatus } from '@reuse/code/interfaces/prescription-modal.inteface';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class PrescriptionModelState {
  modalState = signal<PrescriptionModelStatus>({ state: LoadingStatus.INITIAL });

  setModalState(state: LoadingStatus, success?: string, error?: HttpErrorResponse) {
    this.modalState.set({ state, success, error });
  }

  setInitialState() {
    this.modalState.set({ state: LoadingStatus.INITIAL });
  }
}
