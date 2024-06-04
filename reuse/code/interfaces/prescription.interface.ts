import { Professional } from './professional.interface';
import { Period } from './fhir.interface';
import { Organization } from './organization.interface';


export interface ReadPrescription {
  id: string;
  patientIdentifier: string;
  templateCode: string;
  authoredOn: string;
  requester?: Professional;
  status?: Status;
  period: { start: string; end: string; };
  referralTask: ReferralTask;
  performerTasks: PerformerTask[];
  organizationTasks: OrganizationTask[];
  responses: Record<string, any>;
  intent?: string
}

export interface ReferralTask {
  id: string;
  status: TaskStatus;
}

export interface PerformerTask {
  id: string;
  status: TaskStatus;
  careGiverSsin: string;
  careGiver: Professional;
  executionPeriod?: Period;
}

export interface OrganizationTask {
  id: string;
  status: TaskStatus;
  organizationNihdi: string;
  organization: Organization;
  performerTasks: PerformerTask[];
  executionPeriod?: Period;
}

export enum TaskStatus {
  DRAFT = 'DRAFT',
  REQUESTED = 'REQUESTED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
  ENTEREDINERROR = 'ENTEREDINERROR',
  READY = 'READY',
  INPROGRESS = 'INPROGRESS',
  ONHOLD = 'ONHOLD',
  COMPLETED = "COMPLETED"
}

export interface CreatePrescriptionRequest {
  subject: string;
  templateCode: string;
  responses: Record<string, any>;
}

export interface TemplateId {
  snomed: string;
  orderDetail?: string;
}


export const enum Status {
  'DRAFT' = 'DRAFT',
  'BLACKLISTED' = 'BLACKLISTED',
  'PENDING' = 'PENDING',
  'OPEN' = 'OPEN',
  'CANCELLED' = 'CANCELLED',
  'EXPIRED' = 'EXPIRED',
  'IN_PROGRESS' = 'IN_PROGRESS',
  'DONE' = 'DONE',
}

export interface PrescriptionCancellation {
  reason?: string;
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
}
