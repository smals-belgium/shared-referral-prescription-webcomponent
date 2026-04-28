import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostBinding,
  inject,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import {
  BaseElementControl,
  ElementGroup,
  EvfTranslateService,
  FormTemplate,
  SupportedLocales,
} from '@smals-belgium-shared/vas-evaluation-form-ui-core';
import { EvfDynamicFormComponent } from '@smals-belgium-shared/vas-evaluation-form-ui-material/dynamic-form';
import { NgTemplateOutlet } from '@angular/common';
import { DateAdapter } from '@angular/material/core';
import { DateTime } from 'luxon';
import { PssService } from '@reuse/code/services/api/pss.service';
import { TranslateService } from '@ngx-translate/core';
import { TemplateVersion } from '@reuse/code/openapi';
import { Lang } from '@reuse/code/constants/languages';
import { formatToEvfLangCode } from '@reuse/code/evf/utils/evf-utils';

@Component({
  selector: 'evf-form',
  templateUrl: './evf-form.component.html',
  styleUrls: ['./evf-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EvfDynamicFormComponent, NgTemplateOutlet],
  providers: [EvfTranslateService],
})
export class EvfFormWebComponent implements OnChanges, OnInit {
  private readonly evfTranslate = inject(EvfTranslateService);
  private readonly dateAdapter = inject(DateAdapter<DateTime>);
  private readonly pssService = inject(PssService);
  private readonly translate = inject(TranslateService);

  private elementGroup?: ElementGroup;

  parsedTemplate?: FormTemplate;

  metaData = {
    pssActive: false,
  };

  @HostBinding('attr.lang')
  @Input()
  lang: string = Lang.FR.full;
  @Input() template!: TemplateVersion | string;
  @Input() readonly = false;
  @Input() submitted = false;
  @Input() status: boolean | undefined;

  @Output() changeElementGroup = new EventEmitter<ElementGroup>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['lang']) {
      const formattedLang = formatToEvfLangCode(this.lang);
      this.dateAdapter.setLocale(SupportedLocales[formattedLang]);
      this.evfTranslate.setCurrentLang(formattedLang);
      this.translate.use(this.lang);
    }
    if (changes['template']) {
      this.parsedTemplate = (
        typeof this.template === 'string' ? JSON.parse(this.template) : this.template
      ) as FormTemplate;
    }
    if (changes['readonly'] && this.readonly && this.elementGroup) {
      this.disableFields(this.elementGroup.childElementControls);
    }

    if (changes['status']) {
      if (this.status !== undefined) {
        this.pssService.setStatus(this.status);
        this.metaData = {
          pssActive: this.status,
        };
      }
    }
  }

  private disableFields(elementControls: BaseElementControl[]): void {
    elementControls?.forEach(f => {
      f.nativeControl.disable();
      this.disableFields(f.childElementControls);
    });
  }

  ngOnInit(): void {
    this.initEvfTranslate();
  }

  private initEvfTranslate(): void {
    const formattedLang = formatToEvfLangCode(this.lang);

    this.dateAdapter.setLocale(SupportedLocales[formattedLang]);
    this.evfTranslate.setDefaultLang(Lang.FR.short);
    this.evfTranslate.setCurrentLang(formattedLang);
    this.evfTranslate.addTranslations({
      DATE_NOT_AFTER: {
        nl: 'Datum mag niet na ${date} liggen',
        fr: 'La date doit être <= ${date}',
      },
      DATE_NOT_BEFORE: {
        nl: 'Datum mag niet voor ${date} liggen',
        fr: 'La date doit être >= ${date}',
      },
      NO_AGE_OR_GENDER_SPECIFIED: {
        nl: 'Leeftijd en geslacht zijn verplicht!',
        fr: "L'âge et le sexe sont obligatoires!",
      },
      NO_AGE_SPECIFIED: {
        nl: 'Leeftijd is verplicht!',
        fr: "L'âge est obligatoires!",
      },
      NO_GENDER_SPECIFIED: {
        nl: 'Leeftijd en geslacht zijn verplicht!',
        fr: 'Le sexe est obligatoires!',
      },
    });
  }

  setElementGroup(elementGroup: ElementGroup): void {
    this.elementGroup = elementGroup;
    this.changeElementGroup.emit(elementGroup);
  }

  hasEvfRequiredWrapperWithLabel(parent: ElementGroup): boolean {
    if (!parent?.element?.custom?.['required']) return false;
    return parent?.element?.elements?.some(element => element.labelTranslationId) ?? false;
  }
}
