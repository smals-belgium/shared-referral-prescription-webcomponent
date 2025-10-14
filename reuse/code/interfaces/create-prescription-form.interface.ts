import { ElementGroup } from '@smals/vas-evaluation-form-ui-core';
import { Signal } from '@angular/core';
import { DataState, LoadingStatus } from '@reuse/code/interfaces/data-state.interface';
import { ReadRequestResource, TemplateVersion } from '@reuse/code/openapi';

export interface CreatePrescriptionForm {
  generatedUUID: string;
  trackId: number;
  templateCode: string;
  elementGroup?: ElementGroup;
  formTemplateState$: Signal<DataState<TemplateVersion>>;
  submitted?: boolean;
  status?: LoadingStatus;
  initialPrescription?: ReadRequestResource;
  modelResponses?: Record<string, unknown>;
  modelName?: string;
  modelId?: number;
}
