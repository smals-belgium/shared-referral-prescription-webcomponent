import { ChangeDetectorRef, Pipe, PipeTransform } from '@angular/core';
import { translateOccurrenceTiming, validateOccurrenceTiming } from '@reuse/code/utils/occurrence-timing.utils';
import { OccurrenceTiming } from '@reuse/code/interfaces';
import { EvfTranslateService } from '@smals-belgium-shared/vas-evaluation-form-ui-core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Lang } from '@reuse/code/constants/languages';
import { SupportedLanguages } from '@reuse/code/evf/utils/evf-utils';

@Pipe({
  name: 'occurrenceTiming',
  standalone: true,
  pure: false,
})
export class OccurrenceTimingPipe implements PipeTransform {
  private occurrenceTiming?: OccurrenceTiming;
  private language?: SupportedLanguages;
  private translated = '';

  constructor(
    private readonly evfTranslate: EvfTranslateService,
    private readonly cdRef: ChangeDetectorRef
  ) {
    this.language = this.evfTranslate.currentLang as SupportedLanguages;
    this.evfTranslate.currentLang$.pipe(takeUntilDestroyed()).subscribe(() => {
      this.language = this.evfTranslate.currentLang as SupportedLanguages;
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
    if (validateOccurrenceTiming(this.occurrenceTiming)) {
      this.translated = this.occurrenceTiming
        ? translateOccurrenceTiming(this.occurrenceTiming, this.language ?? Lang.FR.short)
        : '';
    } else {
      this.translated = '';
    }
  }
}
