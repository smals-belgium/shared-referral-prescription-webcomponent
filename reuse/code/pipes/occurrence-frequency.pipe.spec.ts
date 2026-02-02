import { TestBed } from '@angular/core/testing';
import { ChangeDetectorRef } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { OccurrenceFrequencyPipe } from './occurrence-frequency.pipe';
import { EvfTranslateService } from '@smals/vas-evaluation-form-ui-core';
import { Repeat } from '@reuse/code/interfaces';

jest.mock('@reuse/code/utils/occurrence-timing.utils', () => ({
  validateOccurences: jest.fn().mockReturnValue(true),
  translateFrequencyAndPeriod: jest.fn().mockReturnValue('Traduit'),
}));

import { validateOccurences, translateFrequencyAndPeriod } from '@reuse/code/utils/occurrence-timing.utils';

describe('OccurrenceFrequencyPipe', () => {
  let pipe: OccurrenceFrequencyPipe;
  let mockEvfTranslateService: any;
  let mockChangeDetectorRef: any;
  let currentLangSubject: BehaviorSubject<string>;

  beforeEach(() => {
    currentLangSubject = new BehaviorSubject<string>('fr');
    mockEvfTranslateService = {
      currentLang: 'fr',
      currentLang$: currentLangSubject.asObservable(),
    };
    mockChangeDetectorRef = { markForCheck: jest.fn() };

    TestBed.configureTestingModule({
      providers: [
        OccurrenceFrequencyPipe,
        { provide: EvfTranslateService, useValue: mockEvfTranslateService },
        { provide: ChangeDetectorRef, useValue: mockChangeDetectorRef },
      ],
    });

    pipe = TestBed.inject(OccurrenceFrequencyPipe);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return empty string when validation fails', () => {
    (validateOccurences as jest.Mock).mockReturnValue(false);

    const result = pipe.transform(undefined);

    expect(result).toBe('');
    expect(translateFrequencyAndPeriod).not.toHaveBeenCalled();
  });

  it('should translate when valid occurrences', () => {
    const occurrences: Repeat = {
      frequency: 2,
      period: 1,
      periodUnit: 'd',
    };

    (validateOccurences as jest.Mock).mockReturnValue(true);
    (translateFrequencyAndPeriod as jest.Mock).mockReturnValue('2 fois par jour');

    const result = pipe.transform(occurrences);

    expect(validateOccurences).toHaveBeenCalledWith(occurrences);
    expect(translateFrequencyAndPeriod).toHaveBeenCalledWith(occurrences, 'fr');
    expect(result).toBe('2 fois par jour');
  });

});
