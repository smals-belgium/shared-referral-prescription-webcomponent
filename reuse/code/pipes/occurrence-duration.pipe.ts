import { ChangeDetectorRef, inject, Pipe, PipeTransform } from '@angular/core';
import { EvfTranslateService } from '@smals-belgium-shared/vas-evaluation-form-ui-core';
import { BoundsDuration } from '@reuse/code/interfaces';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { translateBoundsDuration, validateBoundsDuration } from '@reuse/code/utils/occurrence-timing.utils';
import { Translation } from '@reuse/code/openapi';

type TranslationType = keyof Translation;
@Pipe({
  standalone: true,
  name: 'occurrenceDuration',
})
export class OccurrenceDurationPipe implements PipeTransform {
  private readonly _evfTranslate = inject(EvfTranslateService);
  private readonly _cdRef = inject(ChangeDetectorRef);

  private boundsDuration?: BoundsDuration;
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

  transform(boundsDuration?: BoundsDuration): unknown {
    if (boundsDuration !== this.boundsDuration) {
      this.boundsDuration = boundsDuration;
      this.translate();
    }
    return this.translated;
  }

  private translate() {
    if (validateBoundsDuration(this.boundsDuration)) {
      this.translated = this.boundsDuration ? translateBoundsDuration(this.boundsDuration, this.language ?? 'fr') : '';
    } else {
      this.translated = '';
    }
  }
}
