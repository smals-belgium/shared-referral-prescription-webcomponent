import { Signal, signal } from '@angular/core';
import { DataState, LoadingStatus } from './../../code/interfaces';
import { combineSignalDataState } from './../../code/utils/rxjs.utils';
import { Param } from '@reuse/code/openapi/param';

describe('combineSignalDataState', () => {
  it('should combine multiple signal states correctly', () => {
    const state1 = signal<DataState<{ value1: string }>>({
      status: LoadingStatus.SUCCESS,
      data: { value1: 'data1' },
      params: { param1: 'param1' },
      error: undefined,
    });

    const state2 = signal<DataState<{ value2: number }>>({
      status: LoadingStatus.LOADING,
      data: { value2: 42 },
      params: { param2: 'param2' },
      error: undefined,
    });

    const combinedState$ = combineSignalDataState<{
      value1: Signal<DataState<string, unknown, Param>>;
      value2: number;
    }>({
      state1,
      state2,
    });

    const result = combinedState$();

    expect(result.status).toBe(LoadingStatus.LOADING);
    expect(result.data).toEqual({
      state1: {
        value1: 'data1',
      },
      state2: {
        value2: 42,
      },
    });
    expect(result.params).toEqual({ state1: { param1: 'param1' }, state2: { param2: 'param2' } });
    expect(result.error).toEqual({});
  });

  it('should set status to ERROR if any state has an error', () => {
    const state1 = signal<DataState<{ value1: string }>>({
      status: LoadingStatus.SUCCESS,
      data: { value1: 'data1' },
      params: {},
      error: undefined,
    });

    const state2 = signal<DataState<{ value2: number }>>({
      status: LoadingStatus.ERROR,
      data: {} as { value2: number },
      params: {},
      error: { message: 'Error occurred' } as Record<string, any>,
    });

    const combinedState$ = combineSignalDataState<{ value1: string; value2: number }>({ state1, state2 });
    const result = combinedState$();

    expect(result.status).toBe(LoadingStatus.ERROR);
    expect(result.error).toEqual({ state2: { message: 'Error occurred' } });
  });
});
