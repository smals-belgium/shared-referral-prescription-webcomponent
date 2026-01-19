import { DataState, LoadingStatus } from '@reuse/code/interfaces';
import { inject, Injectable, signal, WritableSignal } from '@angular/core';
import { PrescriptionTemplateService } from '@reuse/code/services/api/prescriptionTemplate.service';
import { TemplateVersion } from '@reuse/code/openapi';

@Injectable({ providedIn: 'root' })
export class TemplateVersionsState {
  private prescriptionTemplateService = inject(PrescriptionTemplateService);
  private readonly states: Record<string, WritableSignal<DataState<TemplateVersion>>> = {};

  loadTemplateVersionForInstance(instanceId: string, templateCode: string) {
    const key = `${templateCode}::${instanceId}`;
    this.states[key] = signal({ status: LoadingStatus.LOADING });

    this.prescriptionTemplateService.findOneVersion(templateCode).subscribe({
      next: data => {
        this.states[key].set({ status: LoadingStatus.SUCCESS, data });
      },
      error: (error: Record<string, unknown>) => {
        this.states[key].set({ status: LoadingStatus.ERROR, error });
      },
    });
  }

  getStateForInstance(instanceId: string, templateCode: string) {
    const key = `${templateCode}::${instanceId}`;
    if (!this.states[key]) {
      this.states[key] = signal({ status: LoadingStatus.INITIAL });
    }
    return this.states[key];
  }

  getState(templateCode: string) {
    const key = Object.keys(this.states).find(k => k.startsWith(`${templateCode}::`)) ?? templateCode;
    return (this.states[key] ??= signal({ status: LoadingStatus.INITIAL }));
  }

  cleanupInstance(instanceId: string, templateCode: string) {
    const key = `${templateCode}::${instanceId}`;
    delete this.states[key];
  }

  cleanupAllInstances() {
    Object.keys(this.states).forEach(key => delete this.states[key]);
  }
}
