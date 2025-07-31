export interface AccessMatrix {
  quality: Quality;
  templateName: string;
  assignPrescription: boolean;
  assignProposal: boolean;
  createPrescription: boolean;
  evaluateProposal: boolean;
  consultPrescription: boolean;
  cancelPrescription: boolean;
  createProposal: boolean;
  consultProposal: boolean;
  executeTreatment: boolean;
  interruptTreatment: boolean;
  revokeTreatment: boolean;
  removeAssignationPrescription: boolean;
  removeAssignationProposal: boolean;
  cancelProposal: boolean;
}

export type Permissions = keyof Omit<AccessMatrix, 'quality'|'templateName'>;

export enum Quality {
  nurse = 'NURSE',
  patient = 'PATIENT',
  physician = 'PHYSICIAN',
  physiotherapist = 'PHYSIOTHERAPIST'
}
