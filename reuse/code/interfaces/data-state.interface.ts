export enum LoadingStatus {
  INITIAL = 'INITIAL',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  UPDATING = 'UPDATING',
  ERROR = 'ERROR'
}

export interface DataState<T> {
  status: LoadingStatus;
  data?: T;
  error?: any;
  params?: Record<string, any>;
}
