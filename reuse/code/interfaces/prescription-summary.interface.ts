import { Professional } from './professional.interface';
import { Status } from './prescription.interface';

export interface PrescriptionSummary {
  id: string;
  templateCode: string;
  authoredOn: string;
  requester?: Professional;
  careGivers?: Professional[];
  status?: Status;
  assigned: boolean;
  period: { start: string; end: string; };
}

export interface PrescriptionSummaryList {
  total: number;
  items: PrescriptionSummary[];
}
