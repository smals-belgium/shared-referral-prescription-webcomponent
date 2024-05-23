import { BasedOn, Code, Identifier, Owner, Period } from './fhir.interface';

export interface Task {
  resourceType: string;
  id: string;
  meta: TaskMeta;
  identifier: Identifier[];
  basedOn: BasedOn[];
  partOf: BasedOn[];
  status: string;
  intent: string;
  code: Code;
  authoredOn: Date;
  owner?: Owner;
  executionPeriod?: Period;
}

export interface TaskMeta {
  profile: string[];
}
