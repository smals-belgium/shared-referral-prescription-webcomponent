import { ChangeDetectorRef, inject, Pipe, PipeTransform } from '@angular/core';
import { EvfTranslateService } from '@smals/vas-evaluation-form-ui-core';
import { Repeat } from '@reuse/code/interfaces';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { translateFrequencyAndPeriod, validateOccurences } from '@reuse/code/utils/occurrence-timing.utils';
import { Translation } from '@reuse/code/openapi';

type TranslationType = keyof Translation;
@Pipe({
  standalone: true,
  name: 'occurrenceFrequency',
})
export class OccurrenceFrequencyPipe implements PipeTransform {
  private readonly _evfTranslate = inject(EvfTranslateService);
  private readonly _cdRef = inject(ChangeDetectorRef);

  private occurrences?: Repeat;
  private language?: TranslationType;
  private translated = '';

  constructor() {
    this.language = this._evfTranslate.currentLang as TranslationType;
    this._evfTranslate.currentLang$.pipe(takeUntilDestroyed()).subscribe(() => {
      this.language = this._evfTranslate.currentLang as TranslationType;
      this.translate();
      this._cdRef.markForCheck();
    });
  }

  transform(occurrenceTiming?: Repeat): unknown {
    if (occurrenceTiming !== this.occurrences) {
      this.occurrences = occurrenceTiming;
      this.translate();
    }
    return this.translated;
  }

  private translate() {
    if (validateOccurences(this.occurrences)) {
      this.translated = this.occurrences ? translateFrequencyAndPeriod(this.occurrences, this.language ?? 'fr') : '';
    } else {
      this.translated = '';
    }
  }
}
