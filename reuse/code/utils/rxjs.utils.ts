import { Observable } from 'rxjs';
import { DataState, LoadingStatus } from '../interfaces';
import { computed, Signal } from '@angular/core';

export function combineSignalDataState<T>(states: Record<string, Signal<DataState<any>>>): Signal<DataState<T>> {
  return computed(
    () => Object.entries(states).reduce(
      (acc, [key, state$]) => {
        const state = state$();
        if (state.data) {
          acc.data![key as keyof T] = state.data;
        }
        if (state.params) {
          acc.params![key] = state.params;
        }
        if (state.error) {
          acc.error![key as keyof T] = state.error;
        }
        if (state.status === LoadingStatus.ERROR) {
          acc.status = LoadingStatus.ERROR;
        } else if (acc.status !== LoadingStatus.ERROR) {
          if (state.status === LoadingStatus.LOADING || acc.status === LoadingStatus.LOADING) {
            acc.status = LoadingStatus.LOADING;
          } else {
            acc.status = state.status;
          }
        }
        return acc;
      },
      {
        status: LoadingStatus.INITIAL,
        data: {} as Record<string, any>,
        params: {} as Record<string, any>,
        error: {} as Record<string, any>
      } as DataState<T>)
  );
}

export function toDataState(params?: Record<string, any>) {
  return function <T>(source: Observable<T>): Observable<DataState<T>> {
    return new Observable<DataState<T>>(subscriber => {
      subscriber.next({status: LoadingStatus.LOADING, params});
      source.subscribe({
        next(data) {
          subscriber.next({status: LoadingStatus.SUCCESS, data, params});
        },
        error(error) {
          subscriber.next({status: LoadingStatus.ERROR, error, params});
        },
        complete() {
          subscriber.complete();
        }
      });
    });
  };
}
