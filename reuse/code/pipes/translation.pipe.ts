import { ChangeDetectorRef, OnDestroy, Pipe, PipeTransform } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FormTranslation } from '@smals/vas-evaluation-form-ui-core';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
  name: 'translation',
  standalone: true,
  pure: false
})
export class TranslationPipe implements PipeTransform, OnDestroy {
  private destroyed$ = new Subject<void>();
  private value?: FormTranslation;
  private translated?: string;

  constructor(
    private translateService: TranslateService,
    private cd: ChangeDetectorRef
  ) {
    this.listenForLangChanges();
  }

  transform(value?: FormTranslation): string {
    if (!this.translated || this.value !== value) {
      this.value = value;
      this.translate();
    }
    return this.translated || '';
  }

  private listenForLangChanges() {
    this.translateService.onLangChange
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => {
        this.translate();
        this.cd.markForCheck();
      });
  }

  private translate(): void {
    const lang = (this.translateService.currentLang || this.translateService.defaultLang).substring(0, 2) as 'nl' | 'fr' | 'de' | 'en';
    this.translated = this.value?.[lang];
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
