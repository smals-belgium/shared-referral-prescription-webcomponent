import { ChangeDetectorRef, inject, Pipe, PipeTransform } from '@angular/core';
import { EvfTranslateService } from '@smals/vas-evaluation-form-ui-core';
import { OccurrenceTiming } from '@reuse/code/interfaces';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  translateOccurrenceDuration,
  validateOccurrenceTiming,
} from '@reuse/code/utils/occurrence-timing.utils';

@Pipe({
  standalone: true,
  name: 'occurrenceDuration',
})
export class OccurrenceDurationPipe implements PipeTransform {
  private readonly _evfTranslate = inject(EvfTranslateService);
  private readonly _cdRef = inject(ChangeDetectorRef);

  private occurrenceTiming?: OccurrenceTiming;
  private language?: 'nl' | 'fr';
  private translated = '';

  constructor() {
    this.language = this._evfTranslate.currentLang as 'nl' | 'fr';
    this._evfTranslate.currentLang$.pipe(takeUntilDestroyed()).subscribe(() => {
      this.language = this._evfTranslate.currentLang as 'nl' | 'fr';
      this.translate();
      this._cdRef.markForCheck();
    });
  }

  transform(occurrenceTiming?: OccurrenceTiming): unknown {
    if (occurrenceTiming !== this.occurrenceTiming) {
      this.occurrenceTiming = occurrenceTiming;
      this.translate();
    }
    return this.translated;
  }

  private translate() {
    if (validateOccurrenceTiming(this.occurrenceTiming)) {
      this.translated = this.occurrenceTiming
        ? translateOccurrenceDuration(this.occurrenceTiming, this.language ?? 'fr')
        : '';
    } else {
      this.translated = '';
    }
  }
}
