import { DataState, LoadingStatus } from '@reuse/code/interfaces';
import { inject, Injectable, signal, WritableSignal } from '@angular/core';
import { PrescriptionTemplateService } from '@reuse/code/services/api/prescriptionTemplate.service';
import { TemplateVersion } from '@reuse/code/openapi';

@Injectable({ providedIn: 'root' })
export class TemplateVersionsState {
  private prescriptionTemplateService = inject(PrescriptionTemplateService);
  private readonly states: Record<string, WritableSignal<DataState<TemplateVersion>>> = {};

  loadTemplateVersion(templateCode: string) {
    if (!this.states[templateCode]) {
      this.states[templateCode] = signal({ status: LoadingStatus.LOADING });
    } else {
      this.states[templateCode].set({ status: LoadingStatus.LOADING });
    }
    this.prescriptionTemplateService.findOneVersion(templateCode).subscribe({
      next: data => {
        this.states[templateCode].set({ status: LoadingStatus.SUCCESS, data });
      },
      error: (error: Record<string, unknown>) => {
        this.states[templateCode].set({ status: LoadingStatus.ERROR, error });
      },
    });
  }

  getState(templateCode: string) {
    if (!this.states[templateCode]) {
      this.states[templateCode] = signal({ status: LoadingStatus.INITIAL });
    }
    return this.states[templateCode];
  }
}
