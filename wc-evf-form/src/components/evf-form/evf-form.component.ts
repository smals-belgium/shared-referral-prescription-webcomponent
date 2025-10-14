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
  ViewEncapsulation,
} from '@angular/core';
import {
  BaseElementControl,
  ElementGroup,
  EvfTranslateService,
  FormTemplate,
  SupportedLocales,
} from '@smals/vas-evaluation-form-ui-core';
import { EvfDynamicFormComponent } from '@smals/vas-evaluation-form-ui-material/dynamic-form';
import { NgTemplateOutlet } from '@angular/common';
import { DateAdapter } from '@angular/material/core';
import { DateTime } from 'luxon';
import { PssService } from '@reuse/code/services/api/pss.service';
import { AuthService } from '@reuse/code/services/auth/auth.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  templateUrl: './evf-form.component.html',
  styleUrls: ['./evf-form.component.scss'],
  encapsulation: ViewEncapsulation.ShadowDom,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EvfDynamicFormComponent, NgTemplateOutlet],
})
export class EvfFormWebComponent implements OnChanges, OnInit {
  private elementGroup?: ElementGroup;

  parsedTemplate?: FormTemplate;

  metaData = {
    pssActive: false,
  };

  @HostBinding('attr.lang')
  @Input()
  lang = 'fr-BE';
  @Input() template!: FormTemplate | string;
  @Input() readonly = false;
  @Input() submitted = false;
  @Input() services?: {
    getAccessToken: (audience?: string) => Promise<string | null>;
  };
  @Input() status: boolean | undefined;

  @Output() changeElementGroup = new EventEmitter<ElementGroup>();

  constructor(
    private readonly evfTranslate: EvfTranslateService,
    private readonly dateAdapter: DateAdapter<DateTime>,
    private readonly pssService: PssService,
    private readonly authService: AuthService,
    private readonly translate: TranslateService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['lang']) {
      const formattedLang = this.formatToEvfLangCode(this.lang);
      this.dateAdapter.setLocale(SupportedLocales[formattedLang]);
      this.evfTranslate.setCurrentLang(formattedLang);
      this.translate.use(this.lang);
    }
    if (changes['template']) {
      this.parsedTemplate = typeof this.template === 'string' ? JSON.parse(this.template) : this.template;
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

    if (changes['services']) {
      this.handleTokenChange();
    }
  }

  private handleTokenChange(): void {
    if (this.services?.getAccessToken) {
      this.authService.init(this.services.getAccessToken);
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
    const formattedLang = this.formatToEvfLangCode(this.lang);
    this.dateAdapter.setLocale(SupportedLocales[formattedLang]);
    this.evfTranslate.setDefaultLang('fr');
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

  private formatToEvfLangCode(localeCode: string): 'nl' | 'fr' {
    return (localeCode?.substring(0, 2) as 'nl' | 'fr') ?? 'fr';
  }

  setElementGroup(elementGroup: ElementGroup): void {
    this.elementGroup = elementGroup;
    this.changeElementGroup.emit(elementGroup);
  }
}
