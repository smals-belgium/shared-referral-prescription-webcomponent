import { DataState, LoadingStatus } from '../interfaces';
import { signal } from '@angular/core';
import { toDataState } from '../utils/rxjs.utils';
import { Observable, ReplaySubject } from 'rxjs';

export abstract class BaseState<T> {

  protected readonly _state = signal<DataState<T>>({status: LoadingStatus.INITIAL});

  readonly state = this._state.asReadonly();

  protected load(source$: Observable<T>, params?: Record<string, any>) {
    const subject = new ReplaySubject<T>(1);
    source$
      .pipe(toDataState(params))
      .subscribe({
        next: (result) => {
          this._state.set(result);
          if (result.status === LoadingStatus.SUCCESS) {
            subject.next(result.data!);
            subject.complete();
          } else if (result.status === LoadingStatus.ERROR) {
            subject.error(result.error);
          }
        },
        error: err => {
          return subject.error(err)
        }
      });
    return subject.asObservable();
  }
}
