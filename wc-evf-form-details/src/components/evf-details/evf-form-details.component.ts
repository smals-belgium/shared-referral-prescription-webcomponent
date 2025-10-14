import {
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewEncapsulation,
} from '@angular/core';
import {
  ElementGroup,
  ElementGroupBuilder,
  EvfFormDetailGroupComponent,
  EvfTranslateService,
  FormTemplate,
  SupportedLocales,
} from '@smals/vas-evaluation-form-ui-core';
import { NgTemplateOutlet } from '@angular/common';
import { DateAdapter } from '@angular/material/core';
import { DateTime } from 'luxon';
import { AuthService } from '@reuse/code/services/auth/auth.service';
import { TranslateService } from '@ngx-translate/core';
import { PssService } from '@reuse/code/services/api/pss.service';

@Component({
  templateUrl: './evf-form-details.component.html',
  styleUrls: ['./evf-form-details.component.scss'],
  encapsulation: ViewEncapsulation.ShadowDom,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [EvfTranslateService],
  imports: [EvfFormDetailGroupComponent, NgTemplateOutlet],
})
export class EvfFormDetailsWebComponent implements OnChanges, OnInit {
  elementGroup!: ElementGroup;

  metaData = {
    pssActive: false,
    isProfessional: false,
  };

  @HostBinding('attr.lang')
  @Input()
  lang = 'fr-BE';
  @Input() template!: FormTemplate;
  @Input() responses!: Record<string, any>;
  @Input() services?: {
    getAccessToken: (audience?: string) => Promise<string | null>;
  };
  @Input() status: boolean | undefined;
  @Input() isProfessional: boolean | undefined;

  constructor(
    private readonly evfTranslate: EvfTranslateService,
    private readonly dateAdapter: DateAdapter<DateTime>,
    private readonly pssService: PssService,
    private readonly elementGroupBuilder: ElementGroupBuilder,
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
      this.evfTranslate.load(this.template);
      this.elementGroup = this.elementGroupBuilder.build(this.template, {});
    }
    if (changes['responses']) {
      this.elementGroup.setValue(this.responses);
    }
    if (changes['services']) {
      this.handleTokenChange();
    }
    if (changes['status']) {
      if (this.status !== undefined) {
        this.pssService.setStatus(this.status);
        this.metaData.pssActive = this.status;
      }
    }
    if (changes['isProfessional']) {
      if (this.isProfessional !== undefined) {
        this.metaData.isProfessional = this.isProfessional;
      }
    }
  }

  private handleTokenChange(): void {
    if (this.services?.getAccessToken) {
      this.authService.init(this.services.getAccessToken);
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
