import { DatePipe } from './date.pipe';
import { of, timer } from 'rxjs';
import { mergeMap, take } from 'rxjs/operators';
import { DateTime } from 'luxon';

describe('DatePipe', () => {
  let instance: DatePipe;
  let mockDateAdapter: any;
  let mockChangeDetectorRef: any;

  beforeEach(() => {
    mockDateAdapter = {
      parse: jest.fn().mockReturnValue(DateTime.now()),
      format: jest.fn().mockReturnValue('formatted'),
      localeChanges: of()
    };
    mockChangeDetectorRef = {
      markForCheck: jest.fn()
    };
    instance = new DatePipe(
      mockDateAdapter,
      mockChangeDetectorRef
    );
  });

  afterEach(() => {
    instance.ngOnDestroy();
  });

  it('should format the date and only format the date once', () => {
    let result = instance.transform('2019-07-13T23:55:00+02:00', 'DD');
    expect(mockDateAdapter.parse).toHaveBeenCalledTimes(1);
    expect(mockDateAdapter.format).toHaveBeenCalledTimes(1);
    expect(result).toEqual('formatted');

    result = instance.transform('2019-07-13T23:55:00+02:00', 'DD');
    expect(mockDateAdapter.parse).toHaveBeenCalledTimes(1);
    expect(mockDateAdapter.format).toHaveBeenCalledTimes(1);
    expect(result).toEqual('formatted');
  });

  it('should format the date again if the value changed', () => {
    let result = instance.transform('2019-07-13T23:55:00+02:00', 'DD');
    expect(mockDateAdapter.parse).toHaveBeenCalledTimes(1);
    expect(mockDateAdapter.format).toHaveBeenCalledTimes(1);
    expect(result).toEqual('formatted');

    result = instance.transform('2020-09-05T23:55:00+02:00', 'DD');
    expect(mockDateAdapter.parse).toHaveBeenCalledTimes(2);
    expect(mockDateAdapter.format).toHaveBeenCalledTimes(2);
    expect(result).toEqual('formatted');
  });

  it('should format the date and only format the date on a local change', () => {
    jest.useFakeTimers();
    mockDateAdapter.localeChanges = timer(5)
      .pipe(
        take(1),
        mergeMap(() => of([void 0]))
      );
    instance = new DatePipe(
      mockDateAdapter,
      mockChangeDetectorRef
    );

    let result = instance.transform('2019-07-13T23:55:00+02:00');
    expect(mockDateAdapter.parse).toHaveBeenCalledTimes(1);
    expect(mockDateAdapter.format).toHaveBeenCalledTimes(1);
    expect(result).toEqual('formatted');

    jest.runAllTimers();

    result = instance.transform('2019-07-13T23:55:00+02:00');
    expect(mockDateAdapter.parse).toHaveBeenCalledTimes(2);
    expect(mockDateAdapter.format).toHaveBeenCalledTimes(2);
    expect(mockChangeDetectorRef.markForCheck).toHaveBeenCalledTimes(1);
    expect(result).toEqual('formatted');

    result = instance.transform('2019-07-13T23:55:00+02:00', 'D');
    expect(mockDateAdapter.parse).toHaveBeenCalledTimes(2);
    expect(mockDateAdapter.format).toHaveBeenCalledTimes(2);
    expect(mockChangeDetectorRef.markForCheck).toHaveBeenCalledTimes(1);
    expect(result).toEqual('formatted');
  });
});
