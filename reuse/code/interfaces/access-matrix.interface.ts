export interface AccessMatrix {
  quality: Quality;
  templateName: string;
  assignCaregiver: boolean;
  createPrescription: boolean;
  consultPrescription: boolean;
  cancelPrescription: boolean;
  createProposal: boolean;
  consultProposal: boolean;
  executeTreatment: boolean;
  interruptTreatment: boolean;
  revokeTreatment: boolean;
  rejectAssignation: boolean;
}

export type Permissions = keyof Omit<AccessMatrix, 'quality'|'templateName'>;

export enum Quality {
  nurse = 'NURSE',
  patient = 'PATIENT',
  physician = 'PHYSICIAN'
}
