import { ReadRequestResource } from '@reuse/code/openapi';

export interface TemplateId {
  snomed: string;
  orderDetail?: string;
}

export interface PrescriptionExecutionStart {
  startDate?: string;
}

export interface PrescriptionExecutionFinish {
  endDate?: string;
}

export interface SearchPrescriptionCriteria {
  patient?: string;
  requester?: string;
  performer?: string;
  historical?: boolean;
}

export interface CreatePrescriptionInitialValues {
  intent: string;
  initialPrescriptionType?: string;
  initialPrescription?: ReadRequestResource;
  initialModelId?: number;
  extend?: boolean;
}

export enum Intent {
  PROPOSAL = 'proposal',
  ORDER = 'order',
  MODEL = 'model',
}

export interface SearchHealthcareProviderCriteria {
  query: string;
  zipCodes: number[];
}
