import { FhirR4TaskStatus } from '@reuse/code/openapi';

export type DisplayStatus = 'assigned' | 'active' | 'interrupted' | 'canceled' | 'inactive';

export const taskStatusDisplayMap: Record<FhirR4TaskStatus, DisplayStatus | undefined> = {
  DRAFT: undefined,
  REQUESTED: undefined,
  RECEIVED: undefined,
  ACCEPTED: undefined,
  REJECTED: undefined,

  READY: 'assigned',
  INPROGRESS: 'active',
  ONHOLD: 'interrupted',
  CANCELLED: 'canceled',
  COMPLETED: 'inactive',

  FAILED: undefined,
  ENTEREDINERROR: undefined,
  NULL: undefined,
};

export function mapFhirTaskStatus(status: FhirR4TaskStatus): DisplayStatus | undefined {
  return taskStatusDisplayMap[status] ?? undefined;
}

export type DisplayColor = 'mh-blue' | 'mh-green' | 'mh-orange' | 'mh-red' | 'mh-black';

const displayStatusColorMap: Record<DisplayStatus, DisplayColor> = {
  assigned: 'mh-blue',
  active: 'mh-green',
  interrupted: 'mh-orange',
  canceled: 'mh-red',
  inactive: 'mh-black',
};

export function mapDisplayStatusToColor(status: FhirR4TaskStatus): DisplayColor | undefined {
  const displayStatus = mapFhirTaskStatus(status);
  if (!displayStatus) return undefined;
  return displayStatusColorMap[displayStatus] ?? 'mh-black';
}
