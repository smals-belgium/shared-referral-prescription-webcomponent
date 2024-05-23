import { ChangeDetectorRef, DestroyRef, Pipe, PipeTransform } from '@angular/core';
import { combineLatest, startWith } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { EvfTemplate, TemplateId } from '../interfaces';
import { templateIdsAreEqual, templateIdToString } from '../utils/template.utils';
import { TemplatesState } from '../states/templates.state';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';

@Pipe({name: 'templateName', pure: false, standalone: true})
export class TemplateNamePipe implements PipeTransform {

  private readonly templates$ = toObservable(this.templatesStateService.state);

  private templates: EvfTemplate[] = [];
  private templateCodeOrId?: string | TemplateId;
  private translated?: string;

  constructor(
    private translateService: TranslateService,
    private templatesStateService: TemplatesState,
    private destroyRef: DestroyRef,
    private cd: ChangeDetectorRef
  ) {
    this.listenForLangChanges();
  }

  transform(templateCodeOrId: string | TemplateId): string {
    if (!this.translated || this.templateCodeOrId !== templateCodeOrId) {
      this.templateCodeOrId = templateCodeOrId;
      this.translate();
    }
    return this.translated || '';
  }

  private listenForLangChanges() {
    const lang$ = this.translateService.onLangChange.pipe(startWith({lang: this.translateService.currentLang}));
    combineLatest([this.templates$, lang$])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([templatesState]) => {
        this.templates = templatesState.data || [];
        this.translate();
        this.cd.markForCheck();
      });
  }

  private translate(): void {
    if (this.templateCodeOrId == null) {
      this.translated = '';
    } else if (typeof this.templateCodeOrId === 'string') {
      const template = this.templates.find((t) => t.code === this.templateCodeOrId);
      const lang = (this.translateService.currentLang || this.translateService.defaultLang).substring(0, 2) as 'nl' | 'fr' | 'de' | 'en';
      this.translated = template?.labelTranslations[lang] || this.templateCodeOrId || '';
    } else {
      const template = this.templates.find((t) => templateIdsAreEqual(this.templateCodeOrId as TemplateId, t.metadata));
      const lang = (this.translateService.currentLang || this.translateService.defaultLang).substring(0, 2) as 'nl' | 'fr' | 'de' | 'en';
      this.translated = template?.labelTranslations[lang] || templateIdToString(this.templateCodeOrId as TemplateId) || '';
    }
  }
}
