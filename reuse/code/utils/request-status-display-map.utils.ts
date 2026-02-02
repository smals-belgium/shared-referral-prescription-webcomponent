import { RequestStatus } from '@reuse/code/openapi';

export type DisplayColor = 'mh-blue' | 'mh-green' | 'mh-orange' | 'mh-red' | 'mh-black';

const displayStatusColorMap: Record<RequestStatus, DisplayColor> = {
  DRAFT: 'mh-black',
  BLACKLISTED: 'mh-red',
  PENDING: 'mh-black',
  OPEN: 'mh-blue',
  CANCELLED: 'mh-red',
  EXPIRED: 'mh-red',
  IN_PROGRESS: 'mh-green',
  DONE: 'mh-black',
  APPROVED: 'mh-green',
  REJECTED: 'mh-red',
};

export function mapDisplayStatusToColor(status: RequestStatus): DisplayColor | undefined {
  return displayStatusColorMap[status] ?? 'mh-black';
}
