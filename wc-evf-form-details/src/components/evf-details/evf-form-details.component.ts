import {
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges
} from '@angular/core';
import {
  ElementGroup,
  ElementGroupBuilder,
  EvfFormDetailGroupComponent,
  EvfTranslateService,
  FormTemplate,
  SupportedLocales
} from '@smals/vas-evaluation-form-ui-core';
import { NgIf, NgTemplateOutlet } from '@angular/common';
import { DateAdapter } from '@angular/material/core';
import { DateTime } from 'luxon';

@Component({
  templateUrl: './evf-form-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [EvfTranslateService],
  standalone: true,
  imports: [
    EvfFormDetailGroupComponent,
    NgTemplateOutlet,
    NgIf
  ]
})
export class EvfFormDetailsWebComponent implements OnChanges, OnInit {

  elementGroup!: ElementGroup;

  @HostBinding('attr.lang')
  @Input() lang = 'fr-BE';
  @Input() template!: FormTemplate;
  @Input() responses!: Record<string, any>;

  constructor(
    private evfTranslate: EvfTranslateService,
    private dateAdapter: DateAdapter<DateTime>,
    private elementGroupBuilder: ElementGroupBuilder
  ) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['lang']) {
      const formattedLang = this.formatToEvfLangCode(this.lang);
      this.dateAdapter.setLocale(SupportedLocales[formattedLang]);
      this.evfTranslate.setCurrentLang(formattedLang);
    }
    if (changes['template']) {
      this.evfTranslate.load(this.template);
      this.elementGroup = this.elementGroupBuilder.build(this.template, {});
    }
    if (changes['responses']) {
      this.elementGroup.setValue(this.responses!);
    }
  }

  ngOnInit(): void {
    this.initEvfTranslate();
  }

  private initEvfTranslate(): void {
    const formattedLang = this.formatToEvfLangCode(this.lang);
    this.dateAdapter.setLocale(SupportedLocales[formattedLang]);
    this.evfTranslate.setDefaultLang('fr');
    this.evfTranslate.setCurrentLang(formattedLang);
  }

  private formatToEvfLangCode(localeCode: string): 'nl' | 'fr' {
    return localeCode.substring(0, 2) as 'nl' | 'fr';
  }
}
