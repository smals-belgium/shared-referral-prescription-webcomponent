import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DataState, LoadingStatus } from '../interfaces';
import { computed, Signal } from '@angular/core';

export function combineLatestMap(sources$: Record<string, Observable<any>>): Observable<Record<string, any>> {
  return combineLatest(Object.values(sources$))
    .pipe(map((results: DataState<any>[]) => {
      const merged: Record<string, any> = {};
      Object.keys(sources$).forEach((key: string, index: number) => {
        merged[key] = results[index];
      });
      return merged;

    }));
}

export function combineDataState<T>(states: Record<string, Observable<DataState<any>>>): Observable<DataState<T>> {
  return combineLatest(Object.values(states))
    .pipe(map((results: DataState<any>[]) => {
      const merged: { status: LoadingStatus, data?: any, params?: any, error?: any } = {
        status: LoadingStatus.SUCCESS,
        data: {},
        error: {},
        params: {}
      };
      Object.keys(states).forEach((key: string, index: number) => {
        const result = results[index];
        merged.params[key] = result.params;
        switch (result.status) {
          case LoadingStatus.ERROR:
            merged.status = LoadingStatus.ERROR;
            merged.error[key] = result.error;
            break;
          case LoadingStatus.LOADING:
            if (merged.status !== LoadingStatus.ERROR) {
              merged.status = LoadingStatus.LOADING;
            }
            break;
          case LoadingStatus.INITIAL:
            if (merged.status !== LoadingStatus.ERROR && merged.status !== LoadingStatus.LOADING) {
              merged.status = LoadingStatus.INITIAL;
            }
            break;
          case LoadingStatus.UPDATING:
            merged.data[key] = result.data;
            if (merged.status !== LoadingStatus.ERROR && merged.status !== LoadingStatus.LOADING && merged.status !== LoadingStatus.INITIAL) {
              merged.status = LoadingStatus.UPDATING;
            }
            break;
          case LoadingStatus.SUCCESS:
            merged.data[key] = result.data;
            merged.error[key] = result.error;
            break;
        }
      });
      return merged;
    }));
}

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
