import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostBinding,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewEncapsulation
} from '@angular/core';
import {
  BaseElementControl,
  ElementGroup,
  EvfTranslateService,
  FormTemplate,
  SupportedLocales
} from '@smals/vas-evaluation-form-ui-core';
import { EvfDynamicFormComponent } from '@smals/vas-evaluation-form-ui-material/dynamic-form';
import { NgIf, NgTemplateOutlet } from '@angular/common';
import { DateAdapter } from '@angular/material/core';
import { DateTime } from 'luxon';

@Component({
  templateUrl: './evf-form.component.html',
  styleUrls: ['./evf-form.component.scss'],
  encapsulation: ViewEncapsulation.ShadowDom,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    EvfDynamicFormComponent,
    NgTemplateOutlet,
    NgIf
  ]
})
export class EvfFormWebComponent implements OnChanges, OnInit {

  private elementGroup?: ElementGroup;

  parsedTemplate?: FormTemplate;

  @HostBinding('attr.lang')
  @Input() lang = 'fr-BE';
  @Input() template!: FormTemplate | string;
  @Input() readonly = false;
  @Input() submitted = false;

  @Output() changeElementGroup = new EventEmitter<ElementGroup>();

  constructor(
    private evfTranslate: EvfTranslateService,
    private dateAdapter: DateAdapter<DateTime>
  ) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['lang']) {
      const formattedLang = this.formatToEvfLangCode(this.lang);
      this.dateAdapter.setLocale(SupportedLocales[formattedLang]);
      this.evfTranslate.setCurrentLang(formattedLang);
    }
    if (changes['template']) {
      this.parsedTemplate = typeof this.template === 'string'
        ? JSON.parse(this.template)
        : this.template;
    }
    if (changes['readonly'] && this.readonly && this.elementGroup) {
      this.disableFields(this.elementGroup.childElementControls);
    }
  }

  private disableFields(elementControls: BaseElementControl[]): void {
    elementControls?.forEach((f) => {
      f.nativeControl.disable();
      this.disableFields(f.childElementControls);
    });
  }

  ngOnInit(): void {
    this.initEvfTranslate();
  }

  private initEvfTranslate(): void {
    const formattedLang = this.formatToEvfLangCode(this.lang);
    this.dateAdapter.setLocale(SupportedLocales[formattedLang]);
    this.evfTranslate.setDefaultLang('fr');
    this.evfTranslate.setCurrentLang(formattedLang);
    this.evfTranslate.addTranslations({
      DATE_NOT_AFTER: {
        nl: 'Datum mag niet na ${date} liggen',
        fr: 'La date doit être <= ${date}'
      },
      DATE_NOT_BEFORE: {
        nl: 'Datum mag niet voor ${date} liggen',
        fr: 'La date doit être >= ${date}'
      }
    });
  }

  private formatToEvfLangCode(localeCode: string): 'nl' | 'fr' {
    return localeCode?.substring(0, 2) as 'nl' | 'fr' || 'fr';
  }

  setElementGroup(elementGroup: ElementGroup): void {
    this.elementGroup = elementGroup;
    this.changeElementGroup.emit(elementGroup);
  }
}
