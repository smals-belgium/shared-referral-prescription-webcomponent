import { ChangeDetectorRef, DestroyRef, Pipe, PipeTransform } from '@angular/core';
import { combineLatest, startWith } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Intent, TemplateId } from '@reuse/code/interfaces';
import { templateIdsAreEqual, templateIdToString } from '@reuse/code/utils/template.utils';
import { TemplatesState } from '@reuse/code/states/api/templates.state';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Template } from '@reuse/code/openapi';
import { Lang } from '@reuse/code/constants/languages';
import { isProposal } from '@reuse/code/utils/utils';

@Pipe({ name: 'templateName', pure: false, standalone: true })
export class TemplateNamePipe implements PipeTransform {
  private readonly templates$ = toObservable(this.templatesStateService.state);

  private templates: Template[] = [];
  private templateCodeOrId?: string | TemplateId;
  private translated?: string;
  private intent?: string | Intent;

  constructor(
    private readonly translateService: TranslateService,
    private readonly templatesStateService: TemplatesState,
    private readonly destroyRef: DestroyRef,
    private readonly cd: ChangeDetectorRef
  ) {
    this.listenForLangChanges();
  }

  transform(templateCodeOrId?: string | TemplateId, prescriptionIntent?: string | Intent): string {
    this.intent = prescriptionIntent;
    if (!templateCodeOrId) return '';

    if (!this.translated || this.templateCodeOrId !== templateCodeOrId) {
      this.templateCodeOrId = templateCodeOrId;
      this.translate();
    }
    return this.translated || '';
  }

  private listenForLangChanges() {
    const lang$ = this.translateService.onLangChange.pipe(startWith({ lang: this.translateService.currentLang }));
    combineLatest([this.templates$, lang$])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([templatesState]) => {
        this.templates = templatesState.data || [];
        this.translate();
        this.cd.markForCheck();
      });
  }

  private translate(): void {
    const prefix = this.addPrefix();
    if (this.templateCodeOrId == null) {
      this.translated = prefix;
      return;
    }

    const template = this.findTemplate();
    const lang = this.getCurrentLang();
    const fallback =
      typeof this.templateCodeOrId === 'string' ? this.templateCodeOrId : templateIdToString(this.templateCodeOrId);

    this.translated = template?.labelTranslations?.[lang]
      ? prefix + template.labelTranslations[lang]
      : prefix + fallback;
  }

  private findTemplate(): Template | undefined {
    if (typeof this.templateCodeOrId === 'string') {
      return this.templates.find(t => t.code === this.templateCodeOrId);
    }
    return this.templates.find(
      t => isTemplateId(t.metadata) && templateIdsAreEqual(this.templateCodeOrId as TemplateId, t.metadata)
    );
  }

  private getCurrentLang(): Lang {
    return (this.translateService.currentLang || this.translateService.defaultLang).substring(0, 2) as Lang;
  }

  private addPrefix() {
    if (isProposal(this.intent)) return this.translateService.instant('templateName.proposalPrefix');
    return '';
  }
}

function isTemplateId(obj: unknown): obj is TemplateId {
  if (typeof obj === 'object' && obj !== null && 'snomed' in obj) {
    const maybeTemplateId = obj as { snomed: unknown };
    return typeof maybeTemplateId.snomed === 'string';
  }
  return false;
}
