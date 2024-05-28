import { DataState, LoadingStatus } from '../interfaces';
import { Injectable, signal, Signal, WritableSignal } from '@angular/core';
import { PrescriptionTemplateService } from '../services/prescription-template.service';
import { FormTemplate } from '@smals/vas-evaluation-form-ui-core';

@Injectable({providedIn: 'root'})
export class TemplateVersionsState {

  private readonly states: Record<string, WritableSignal<DataState<FormTemplate>>> = {};

  constructor(
    private prescriptionTemplateService: PrescriptionTemplateService
  ) {
  }

  loadTemplateVersion(templateCode: string) {
    if (!this.states[templateCode]) {
      this.states[templateCode] = signal({status: LoadingStatus.LOADING});
    } else {
      this.states[templateCode].set({status: LoadingStatus.LOADING});
    }
    this.prescriptionTemplateService.findOneVersion(templateCode)
      .subscribe({
        next: (data) => {
          this.states[templateCode].set({status: LoadingStatus.SUCCESS, data});
        },
        error: (error) => {
          this.states[templateCode].set({status: LoadingStatus.ERROR, error});
        }
      });
  }

  getState(templateCode: string): Signal<DataState<FormTemplate>> {
    if (!this.states[templateCode]) {
      this.states[templateCode] = signal({status: LoadingStatus.INITIAL});
    }
    return this.states[templateCode];
  }

}
