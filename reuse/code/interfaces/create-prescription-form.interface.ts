import { ElementGroup, FormTemplate } from '@smals/vas-evaluation-form-ui-core';
import { Signal } from '@angular/core';
import { DataState, LoadingStatus } from './data-state.interface';
import { ReadPrescription } from './prescription.interface';

export interface CreatePrescriptionForm {
  generatedUUID: string;
  trackId: number;
  templateCode: string;
  elementGroup?: ElementGroup;
  formTemplateState$: Signal<DataState<FormTemplate>>;
  submitted?: boolean;
  status?: LoadingStatus;
  initialPrescription?: ReadPrescription;
  modelResponses?: Record<string, unknown>;
  modelName?: string;
  modelId?: number;
}
