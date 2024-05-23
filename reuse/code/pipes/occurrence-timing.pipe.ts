import { ChangeDetectorRef, Pipe, PipeTransform } from '@angular/core';
import { translateOccurrenceTiming } from '../utils/occurrence-timing.utils';
import { OccurrenceTiming } from '../interfaces';
import { EvfTranslateService } from '@smals/vas-evaluation-form-ui-core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Pipe({
  name: 'occurrenceTiming',
  standalone: true,
  pure: false
})
export class OccurrenceTimingPipe implements PipeTransform {

  private occurrenceTiming?: OccurrenceTiming;
  private language?: 'nl' | 'fr';
  private translated = '';

  constructor(
    private evfTranslate: EvfTranslateService,
    private cdRef: ChangeDetectorRef
  ) {
    this.language = this.evfTranslate.currentLang as 'nl' | 'fr';
    this.evfTranslate.currentLang$
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.language = this.evfTranslate.currentLang as 'nl' | 'fr';
        this.translate();
        this.cdRef.markForCheck();
      });
  }

  transform(occurrenceTiming?: OccurrenceTiming): string {
    if (occurrenceTiming !== this.occurrenceTiming) {
      this.occurrenceTiming = occurrenceTiming;
      this.translate();
    }
    return this.translated;
  }

  private translate() {
    this.translated = this.occurrenceTiming
      ? translateOccurrenceTiming(this.occurrenceTiming, this.language || 'fr')
      : '';
  }
}
