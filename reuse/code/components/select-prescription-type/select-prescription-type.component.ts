import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { AbstractControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AsyncPipe } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TranslationPipe } from '../../pipes/translation.pipe';
import { combineLatestWith, Observable, startWith } from 'rxjs';
import { map } from 'rxjs/operators';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { Language } from '@smals/vas-evaluation-form-ui-core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { toSearchString } from '../../utils/utils';
import { HighlightFilterPipe } from '../../pipes/highlight-filter.pipe';
import { EvfTemplate, RADIOLOGY_CODES, PHYSIOTHERAPY_CODES, NURSING_CODES } from '../../interfaces';
import { PrescriptionModel } from '@reuse/code/interfaces';

@Component({
    selector: 'app-select-prescription-type',
    templateUrl: './select-prescription-type.component.html',
    styleUrls: ['./select-prescription-type.component.scss'],
    imports: [
      MatAutocompleteModule,
      MatInputModule,
      MatIconModule,
      MatButtonModule,
      TranslateModule,
      TranslationPipe,
      ReactiveFormsModule,
      HighlightFilterPipe,
      AsyncPipe,
    ]
})
export class SelectPrescriptionTypeComponent implements OnChanges {

  private readonly categories = [
    { code: 'nursingCare'},
    { code: 'radiology'},
    { code: 'physiotherapy'},
  ];
  private readonly categories$ = this.translate.onLangChange.pipe(
    map(() => this.translate.currentLang),
    startWith(this.translate.currentLang),
    map((_lang) => this.categories.map((category) => ({
      ...category,
      label: this.translate.instant('prescription.categories.' + category.code)
    })))
  );
  readonly displayCategoryWith = (category: string | { code: string, label: string }) => !!category && typeof category === 'object'
    ? category.label
    : '';
  readonly displayTypeWith = (type: string | EvfTemplate) => !!type && typeof type === 'object'
    ? type.labelTranslations[this.evfCurrentLang] ?? ''
    : '';
  readonly displayModelWith = (model: string | PrescriptionModel) => !!model && typeof model === 'object'
    ? model.label
    : '';

  categoryOptions$!: Observable<{ code: string, label: string }[]>;
  templatesOptions$!: Observable<EvfTemplate[]>;
  modelOptions$?: Observable<PrescriptionModel[]>;

  @Input() formGroup!: FormGroup;
  @Input() templates!: EvfTemplate[];
  @Input() models?: PrescriptionModel[];
  @Input() showTitle = true;

  constructor(
    private readonly translate: TranslateService
  ) {
  }

  private get evfCurrentLang(): Language {
    return this.translate.currentLang.substring(0, 2) as Language;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['formGroup']) {
      this.formGroup.get('category')?.addValidators(mustBeObjectValidator);
      this.formGroup.get('template')?.addValidators(mustBeObjectValidator);
    }
    if ((changes['formGroup'] ?? changes['templates']) && this.formGroup && this.templates) {
      this.setupAutocompleteOptions();
    }
  }

  private setupAutocompleteOptions(): void {
    const {formGroup, models, evfCurrentLang: currentLang} = this;

    this.categoryOptions$ = this.setupFilteredOptions(
      formGroup.get('category')!,
      this.categories$,
      (cat) => cat.label
    );

    const templatesForCategory$ = this.getTemplatesByCategory(formGroup.get('category')!);

    const templates$ = models
      ? this.getTemplatesByCategoryAndModel(templatesForCategory$, formGroup.get('model')!)
      : templatesForCategory$;

    this.templatesOptions$ = this.setupFilteredOptions(
      formGroup.get('template')!,
      templates$,
      (template) => template.labelTranslations[currentLang]!
    );

    if (models) {
      const modelsForTemplate$ = this.getModelsByTemplateAndCategory(formGroup.get('template')!, templatesForCategory$);
      this.modelOptions$ = this.setupFilteredOptions(formGroup.get('model')!, modelsForTemplate$, (model) => model.label);
    }
  }

  private setupFilteredOptions<T>(
    control: AbstractControl,
    source$: Observable<T[]>,
    getLabel: (item: T) => string
  ): Observable<T[]> {
    return source$.pipe(
      combineLatestWith(control.valueChanges.pipe(map(toSearchString), startWith(''))),
      map(([items, filter]) => items.filter((item) => toSearchString(getLabel(item)).includes(filter)))
    );
  }

  private getTemplatesByCategory(categoryControl: AbstractControl): Observable<EvfTemplate[]> {
    return categoryControl.valueChanges.pipe(startWith(null), map((category) => getFilteredTemplates(this.templates, category)));
  }

  private getTemplatesByCategoryAndModel(
    templatesForCategory$: Observable<EvfTemplate[]>,
    modelControl: AbstractControl
  ): Observable<EvfTemplate[]> {
    const templatesForModel$ = modelControl.valueChanges.pipe(startWith(null), map((model) => getFilteredTemplatesByModel(this.templates, model)));

    return templatesForCategory$.pipe(
      combineLatestWith(templatesForModel$),
      map(([categoryTemplates, modelTemplates]) =>
        categoryTemplates.filter((catTemplate) =>
          modelTemplates.some((modelTemplate) => modelTemplate.id === catTemplate.id)
        )
      )
    );
  }

  private getModelsByTemplateAndCategory(templateControl: AbstractControl, templatesForCategory$: Observable<EvfTemplate[]>) {
    const modelsForTemplates$ = templateControl.valueChanges.pipe(startWith(null), map((template) => getFilteredModels(this.models!, template)));

    return templatesForCategory$.pipe(
      combineLatestWith(modelsForTemplates$),
      map(([categoryTemplates, models]) =>
        models.filter(model => categoryTemplates.some((categoryTemplate) => model.templateId === categoryTemplate.id))
      )
    );
  }

  isRequiredField(field: string) {
    const form_field = this.formGroup.get(field);
    if (!form_field?.validator) {
      return false;
    }

    const validator = form_field.validator({} as AbstractControl);
    return (validator?.['required']);
  }
}

const mustBeObjectValidator = (control: AbstractControl) => {
  return !control.value || typeof control.value === 'object'
    ? null
    : {pickOptionFromList: true}
}


const getFilteredTemplates = (templates: EvfTemplate[], category: any): EvfTemplate[] => {
  console.log("Category", category);
  if (!category) {
    return templates;
  }

  switch (category.code) {
    case 'nursingCare':
      return templates.filter(e => NURSING_CODES.includes(e.code));
    case 'radiology':
      return templates.filter(e => RADIOLOGY_CODES.includes(e.code));
    case 'physiotherapy':
      return templates.filter(e => PHYSIOTHERAPY_CODES.includes(e.code));
    default:
      return [];
  }
}

const getFilteredTemplatesByModel  = (templates: EvfTemplate[], model: PrescriptionModel): EvfTemplate[] => {
  if (!model) {
    return templates;
  }

  return templates.filter(e => e.id === model.templateId)
}

const getFilteredModels = (models: PrescriptionModel[], template: EvfTemplate): PrescriptionModel[] => {
  if (!template) {
    return models;
  }

  return models.filter(e => e.templateId === template.id)
}

