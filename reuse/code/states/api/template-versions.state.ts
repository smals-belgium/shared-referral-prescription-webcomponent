import { DataState, LoadingStatus } from '@reuse/code/interfaces';
import { inject, Injectable, Signal, signal, WritableSignal } from '@angular/core';
import { PrescriptionTemplateService } from '@reuse/code/services/api/prescriptionTemplate.service';
import { TemplateVersion } from '@reuse/code/openapi';
import { Observable, ReplaySubject } from 'rxjs';
import { toDataState } from '@reuse/code/utils/rxjs.utils';

@Injectable({ providedIn: 'root' })
export class TemplateVersionsState {
  private prescriptionTemplateService = inject(PrescriptionTemplateService);
  private readonly states: Record<string, WritableSignal<DataState<TemplateVersion>>> = {};

  loadTemplateVersionForInstance(instanceId: string, templateCode: string): Observable<TemplateVersion> {
    const key = `${templateCode}::${instanceId}`;

    if (!this.states[key] && this.states[templateCode]) {
      this.states[key] = this.states[templateCode];
      delete this.states[templateCode];
    }

    this.states[key] ??= signal({ status: LoadingStatus.INITIAL });

    const subject = new ReplaySubject<TemplateVersion>(1);
    this.prescriptionTemplateService
      .findOneVersion(templateCode)
      .pipe(toDataState())
      .subscribe({
        next: result => {
          this.states[key].set(result);
          if (result.status === LoadingStatus.SUCCESS) {
            subject.next(result.data!);
            subject.complete();
          } else if (result.status === LoadingStatus.ERROR) {
            subject.error(result.error);
          }
        },
        error: err => subject.error(err),
      });

    return subject.asObservable();
  }

  getStateForInstance(instanceId: string, templateCode: string) {
    const key = `${templateCode}::${instanceId}`;
    this.states[key] ??= signal({ status: LoadingStatus.INITIAL });
    return this.states[key].asReadonly();
  }

  getState(templateCode: string) {
    const key = Object.keys(this.states).find(k => k.startsWith(`${templateCode}::`)) ?? templateCode;
    this.states[key] ??= signal({ status: LoadingStatus.INITIAL });
    return this.states[key].asReadonly();
  }

  cleanupInstance(instanceId: string, templateCode: string) {
    const key = `${templateCode}::${instanceId}`;
    delete this.states[key];
  }

  cleanupAllInstances() {
    Object.keys(this.states).forEach(key => delete this.states[key]);
  }
}
