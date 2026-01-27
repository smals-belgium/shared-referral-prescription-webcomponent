import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import {
  BaseElementControl,
  ElementGroup,
  EvfTranslateService,
  FormTemplate,
} from '@smals-belgium-shared/vas-evaluation-form-ui-core';
import { TranslateService } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { NgTemplateOutlet } from '@angular/common';
import { EvfDynamicFormComponent } from '@smals-belgium-shared/vas-evaluation-form-ui-material/dynamic-form';

@Component({
  selector: 'app-create-prescription-card',
  templateUrl: './create-prescription-card.component.html',
  styleUrls: ['./create-prescription-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [EvfTranslateService],
  standalone: true,
  imports: [EvfDynamicFormComponent, NgTemplateOutlet],
})
export class CreatePrescriptionCardComponent implements OnChanges, OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private elementGroup?: ElementGroup;

  @Input() template!: FormTemplate;
  @Input() readonly = false;
  @Input() submitted = false;

  @Output() changeElementGroup = new EventEmitter<ElementGroup>();

  constructor(
    private readonly translate: TranslateService,
    private readonly evfTranslate: EvfTranslateService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['readonly'] && this.readonly && this.elementGroup) {
      this.disableFields(this.elementGroup.childElementControls);
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
    this.evfTranslate.setDefaultLang('fr');
    this.evfTranslate.setCurrentLang(this.formatToEvfLangCode(this.translate.currentLang));
    this.evfTranslate.addTranslations({
      DATE_NOT_AFTER: {
        nl: 'Datum mag niet na ${date} liggen',
        fr: 'La date doit être <= ${date}',
      },
      DATE_NOT_BEFORE: {
        nl: 'Datum mag niet voor ${date} liggen',
        fr: 'La date doit être >= ${date}',
      },
    });
    this.translate.onLangChange.pipe(takeUntil(this.destroy$)).subscribe(event => {
      this.evfTranslate.setCurrentLang(this.formatToEvfLangCode(event.lang));
    });
  }

  private formatToEvfLangCode(localeCode: string): 'nl' | 'fr' {
    return (localeCode?.substring(0, 2) as 'nl' | 'fr') ?? 'fr';
  }

  setElementGroup(elementGroup: ElementGroup): void {
    this.elementGroup = elementGroup;
    this.changeElementGroup.emit(elementGroup);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
