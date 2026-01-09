export enum LoadingStatus {
  INITIAL = 'INITIAL',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  UPDATING = 'UPDATING',
  ERROR = 'ERROR',
}

export interface DataState<T, E = unknown, P = Params> {
  status: LoadingStatus;
  data?: T;
  params?: P;
  error?: Record<keyof T, E>;
}

export interface Params {
  page?: number;
  pageSize?: number;
  criteria?: Criteria;
  prescriptions?: Params;
  proposals?: Params;
  templates?: Params;
  models?: Params;

  [key: string]: unknown;
}

interface Criteria {
  patient?: unknown;
}
