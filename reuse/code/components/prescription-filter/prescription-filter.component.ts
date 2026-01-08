import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HighlightFilterPipe } from '../../pipes/highlight-filter.pipe';
import { MatButton } from '@angular/material/button';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TranslationPipe } from '../../pipes/translation.pipe';
import { Language } from '@smals/vas-evaluation-form-ui-core';
import { MultiselectComponent, MultiselectOption } from '../../components/multiselect/multiselect.component';
import { Subscription } from 'rxjs';
import { AccessMatrix, RequestStatus, Template } from '@reuse/code/openapi';
import { Intent } from '@reuse/code/interfaces';

export interface SearchFilter {
  status?: RequestStatus[];
  prescriptionType?: string[];
}

@Component({
  selector: 'app-prescription-filter',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, TranslateModule, MatButton, MultiselectComponent],
  providers: [HighlightFilterPipe, TranslationPipe],
  templateUrl: './prescription-filter.component.html',
  styleUrl: './prescription-filter.component.scss',
})
export class PrescriptionFilterComponent implements OnChanges, OnInit, OnDestroy {
  private readonly translate = inject(TranslateService);
  @Input({ required: true }) templates!: Template[];
  @Input({ required: true }) intent!: 'order' | 'proposal';
  @Input({ required: true }) accessMatrix!: AccessMatrix[];
  @Input({ required: true }) initialFilter!: SearchFilter;
  @Output() filterChange = new EventEmitter<SearchFilter>();

  readonly formGroup: FormGroup;

  templateOptions?: MultiselectOption[];
  statusOptions?: MultiselectOption[];
  private langChangeSubscription!: Subscription;

  constructor() {
    this.formGroup = new FormGroup({
      status: new FormControl<MultiselectOption[] | undefined>(undefined),
      prescriptionType: new FormControl<MultiselectOption[] | undefined>(undefined),
    });
  }

  initStatusOptions(): void {
    const statusList = [
      RequestStatus.Pending,
      RequestStatus.Open,
      RequestStatus.InProgress,
      RequestStatus.Expired,
      RequestStatus.Cancelled,
      RequestStatus.Done,
    ];

    this.updateStatusOptions(statusList);

    this.langChangeSubscription = this.translate.onLangChange.subscribe(() => {
      this.updateStatusOptions(statusList);
      if (this.templates && this.intent && this.accessMatrix) {
        this.filterTemplatesAndMapToOptions();
      }
    });
  }

  updateStatusOptions(statusList: string[]): void {
    this.statusOptions = statusList.map(status => ({
      value: status,
      name: this.translate.instant('prescription.statuses.' + status),
    }));
  }

  ngOnInit() {
    this.initStatusOptions();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      (changes['templates'] || changes['intent'] || changes['accessMatrix']) &&
      this.templates &&
      this.intent &&
      this.accessMatrix
    ) {
      this.filterTemplatesAndMapToOptions();
    }
  }

  private get evfCurrentLang(): Language {
    return this.translate.currentLang.substring(0, 2) as Language;
  }

  private filterTemplatesAndMapToOptions(): void {
    this.templateOptions = this.getTemplatesByIntentAndFilteredByAccessMatrix().map(template => {
      return {
        value: template.code,
        name: template.labelTranslations?.[this.evfCurrentLang] || '',
      } as MultiselectOption;
    });
  }

  private getTemplatesByIntentAndFilteredByAccessMatrix(): Template[] {
    if (!this.intent || !this.templates || !this.accessMatrix) {
      return [];
    }

    switch (this.intent) {
      case Intent.PROPOSAL:
        return this.templates.filter(e => e.code === 'ANNEX_81' && this.filteredOnAccessMatrix(e));
      case Intent.ORDER:
        return this.templates.filter(e => e.code !== 'ANNEX_81' && this.filteredOnAccessMatrix(e));
      default:
        return [];
    }
  }

  private filteredOnAccessMatrix(e: Template) {
    if (this.intent === 'proposal') {
      return this.accessMatrix.find(m => e.code === m.templateName)?.consultProposal;
    }
    return this.accessMatrix.find(m => e.code === m.templateName)?.consultPrescription;
  }

  onSubmit() {
    this.formGroup.markAllAsTouched();
    if (this.formGroup.valid) {
      const values = this.formGroup.value;
      const transformedObject = Object.fromEntries(
        Object.entries(values).map(([key, options]) => {
          return [key, (options as MultiselectOption[])?.map(option => option.value)];
        })
      );
      this.filterChange.emit(transformedObject);
    }
  }

  resetForm() {
    this.formGroup.reset();
    this.filterChange.emit(this.formGroup.value);
  }

  get hasValues(): boolean {
    return Object.values(this.formGroup.value).some(value => !!value);
  }

  ngOnDestroy() {
    this.langChangeSubscription?.unsubscribe();
  }
}
