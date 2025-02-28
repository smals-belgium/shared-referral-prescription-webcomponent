import { LoadingStatus } from './data-state.interface';
import { HttpErrorResponse } from '@angular/common/http';

export interface CreatePrescriptionModel {
  name: string;
  templateCode: string;
  responses: Record<string, any>;
}

export interface UpdatePrescriptionModel {
  name: string;
  responses: Record<string, any>;
}

export interface PrescriptionModel {
  id: number;
  creationDate: string;
  nihii_11: string;
  label: string;
  modelData: Record<string, any>;
  templateVersionId: number;
  templateId: number;
  templateCode: string;
}

export interface PrescriptionModelStatus {
  state: LoadingStatus;
  error?: HttpErrorResponse;
  success?: string;
}

interface Sort {
  empty: boolean;
  sorted: boolean;
  unsorted: boolean;
}

interface Pageable {
  PageNumber: number;
  pageSize: number;
  sort: Sort;
  offset: number;
  paged: boolean;
  unpaged: boolean;
}

export interface PrescriptionModelRequest {
  content: PrescriptionModel[];
  pageable: Pageable;
  last: boolean
  totalPages: number;
  totalElements: number;
  size:  number;
  number:  number;
  sort: Sort;
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}
