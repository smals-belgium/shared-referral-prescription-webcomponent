import { ChangeDetectorRef, inject, Pipe, PipeTransform } from '@angular/core';
import { EvfTranslateService } from '@smals/vas-evaluation-form-ui-core';
import { OccurrenceTiming, Repeat, UnitsOfTime } from '@reuse/code/interfaces';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  translateFrequencyAndPeriod,
  validateOccurrenceTiming,
} from '@reuse/code/utils/occurrence-timing.utils';

@Pipe({
  standalone: true,
  name: 'occurrenceFrequency',
})
export class OccurrenceFrequencyPipe implements PipeTransform {
  private readonly _evfTranslate = inject(EvfTranslateService);
  private readonly _cdRef = inject(ChangeDetectorRef);

  private occurrenceTiming?: OccurrenceTiming;
  private language?: 'nl' | 'fr' | 'en' | 'de';
  private translated = '';

  constructor() {
    this.language = this._evfTranslate.currentLang as 'nl' | 'fr' | 'en' | 'de';
    this._evfTranslate.currentLang$.pipe(takeUntilDestroyed()).subscribe(() => {
      this.language = this._evfTranslate.currentLang as 'nl' | 'fr' | 'en' | 'de';
      this.translate();
      this._cdRef.markForCheck();
    });
  }

  transform(occurrenceTiming?: Repeat): unknown {
    if (occurrenceTiming !== this.occurrenceTiming) {
      this.occurrenceTiming = {
        repeat: {
          frequency: occurrenceTiming?.frequency,
          period: occurrenceTiming?.period,
          periodUnit: occurrenceTiming?.periodUnit as UnitsOfTime
        }
      };
      this.translate();
    }
    return this.translated;
  }

  private translate() {
    if (validateOccurrenceTiming(this.occurrenceTiming)) {
      this.translated = this.occurrenceTiming
        ? translateFrequencyAndPeriod(this.occurrenceTiming, this.language ?? 'fr')
        : '';
    } else {
      this.translated = '';
    }
  }
}
