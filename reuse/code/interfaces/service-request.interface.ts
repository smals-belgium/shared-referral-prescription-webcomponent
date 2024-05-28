import { Code, Coding } from './fhir.interface';

export interface ServiceRequestBundle {
  entry: ServiceRequestBundleEntry[];
  total: number;
}

export interface ServiceRequestBundleEntry {
  resource: ServiceRequest;
}

export interface ServiceRequest {
  resourceType: string;
  id?: string;
  meta: ServiceRequestMeta;
  extension: Extension[];
  identifier: IdentifierElement[];
  status: string;
  intent: string;
  category: Category[];
  priority: string;
  code: Code;
  orderDetail: OrderDetail[];
  subject: Subject;
  occurrenceTiming: OccurrenceTiming;
  authoredOn: Date;
  requester: Requester;
  performer?: Performer[];
}

export interface Category {
  coding: Coding[];
  text: string;
}

export interface OrderDetail {
  coding: Coding[];
}

export interface Extension {
  url: string;
  valuePeriod?: ValuePeriod;
  valueCodeableConcept?: Code;
}

export interface ValuePeriod {
  start: string;
  end: string;
}

export interface IdentifierElement {
  system: string;
  value: string;
}

export interface ServiceRequestMeta {
  versionId: string;
  profile: string[];
}

export interface OccurrenceTiming {
  repeat: Repeat;
}

export type UnitsOfTime = 's' | 'min' | 'h' | 'd' | 'wk' | 'mo' | 'a';
export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface Repeat {
  count?: number;
  frequency?: number;
  period?: number;
  periodUnit?: UnitsOfTime;
  duration?: number;
  durationUnit?: UnitsOfTime;
  dayOfWeek?: Weekday[];
}

export interface Requester {
  reference: string;
}

export interface Performer {
  reference: string;
}

export interface Subject {
  identifier: SubjectIdentifier;
}

export interface SubjectIdentifier {
  use: string;
  system: string;
  value: string;
}
