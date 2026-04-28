import { Injectable, signal } from '@angular/core';
import { LoadingStatus } from '@reuse/code/interfaces';
import { PrescriptionModelStatus } from '@reuse/code/interfaces/prescription-modal.inteface';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class PrescriptionModelState {
  modalStates = signal<PrescriptionModelStatus[]>([]);

  setModalState(prescriptionTrackById: number, state: LoadingStatus, success?: string, error?: HttpErrorResponse) {
    this.modalStates.update(states => {
      const existing = states.findIndex(s => s.prescriptionTrackById === prescriptionTrackById);
      const entry: PrescriptionModelStatus = { prescriptionTrackById, state, success, error };
      if (existing >= 0) {
        const updated = [...states];
        updated[existing] = entry;
        return updated;
      }
      return [...states, entry];
    });
  }

  getModalState(prescriptionTrackById: number): PrescriptionModelStatus | undefined {
    return this.modalStates().find(s => s.prescriptionTrackById === prescriptionTrackById);
  }

  setInitialState(prescriptionTrackById: number) {
    this.modalStates.update(states => {
      const existing = states.findIndex(s => s.prescriptionTrackById === prescriptionTrackById);
      const entry: PrescriptionModelStatus = { prescriptionTrackById, state: LoadingStatus.INITIAL };
      if (existing >= 0) {
        const updated = [...states];
        updated[existing] = entry;
        return updated;
      }
      return [...states, entry];
    });
  }

  resetAll() {
    this.modalStates.set([]);
  }
}
