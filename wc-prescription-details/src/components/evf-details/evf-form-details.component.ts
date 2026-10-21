import {
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import {
  ElementGroup,
  ElementGroupBuilder,
  EvfFormDetailGroupComponent,
  EvfTranslateService,
  FormTemplate,
  SupportedLocales,
} from '@smals-belgium-shared/vas-evaluation-form-ui-core';
import { NgTemplateOutlet } from '@angular/common';
import { DateAdapter } from '@angular/material/core';
import { DateTime } from 'luxon';
import { TranslateService } from '@ngx-translate/core';
import { Intent } from '@reuse/code/interfaces';
import { Lang } from '@reuse/code/constants/languages';
import { formatToEvfLangCode } from '@reuse/code/evf/utils/evf-utils';

interface MetaData {
  isProfessional: boolean;
  intent: Intent | undefined;
}

@Component({
  selector: 'evf-form-details',
  templateUrl: './evf-form-details.component.html',
  standalone: true,
  imports: [EvfFormDetailGroupComponent, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EvfFormDetailsWebComponent implements OnChanges, OnInit {
  elementGroup!: ElementGroup;

  metaData: MetaData = {
    isProfessional: false,
    intent: undefined,
  };

  @HostBinding('attr.lang')
  @Input()
  lang: string = Lang.FR.full;
  @Input() template!: FormTemplate;
  @Input() responses!: Record<string, unknown>;
  @Input() isProfessional: boolean | undefined;
  @Input() intent: string | undefined;

  constructor(
    private readonly evfTranslate: EvfTranslateService,
    private readonly dateAdapter: DateAdapter<DateTime>,
    private readonly elementGroupBuilder: ElementGroupBuilder,
    private readonly translate: TranslateService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['lang']) {
      const formattedLang = formatToEvfLangCode(this.lang);
      this.dateAdapter.setLocale(SupportedLocales[formattedLang]);
      this.evfTranslate.setCurrentLang(formattedLang);
      this.translate.use(this.lang);
    }
    if (changes['template']) {
      this.evfTranslate.load(this.template);
      this.elementGroup = this.elementGroupBuilder.build(this.template, {});
    }
    if ((changes['responses'] && this.elementGroup) || (changes['template'] && this.responses)) {
      this.elementGroup.setValue(this.responses);
    }
    if (changes['isProfessional']) {
      if (this.isProfessional !== undefined) {
        this.metaData.isProfessional = this.isProfessional;
      }
    }

    if (changes['intent']) {
      const normalized = this.intent?.toLowerCase();

      this.metaData.intent = Object.values(Intent).find(value => value === normalized);
    }
  }

  ngOnInit(): void {
    this.initEvfTranslate();
  }

  private initEvfTranslate(): void {
    const formattedLang = formatToEvfLangCode(this.lang);
    this.dateAdapter.setLocale(SupportedLocales[formattedLang]);
    this.evfTranslate.setDefaultLang(Lang.FR.short);
    this.evfTranslate.setCurrentLang(formattedLang);
  }
}
