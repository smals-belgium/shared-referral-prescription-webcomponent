import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { AbstractControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
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
import { EvfTemplate } from '../../interfaces';

@Component({
  standalone: true,
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
    NgFor,
    NgIf,
    AsyncPipe
  ]
})
export class SelectPrescriptionTypeComponent implements OnChanges {

  private readonly categories = [

    { code: 'bandagisterie'},
    { code: 'dentistry'},
    { code: 'physiotherapy'},
    { code: 'orthopedics'},
    { code: 'otolaryngology'},
    { code: 'radiology'},
    { code: 'nursingCare'},
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
    ? type.labelTranslations[this.evfCurrentLang] || ''
    : '';
  categoryOptions$!: Observable<{ code: string, label: string }[]>;
  templatesOptions$!: Observable<EvfTemplate[]>;

  @Input() formGroup!: FormGroup;
  @Input() templates!: EvfTemplate[];
  @Input() showTitle = true;

  constructor(
    private translate: TranslateService
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
    if ((changes['formGroup'] || changes['templates']) && this.formGroup && this.templates) {
      this.setupAutocompleteOptions();
    }
  }

  private setupAutocompleteOptions(): void {
    this.categoryOptions$ = this.categories$.pipe(
      combineLatestWith(this.formGroup.get('category')!.valueChanges.pipe(
        map((search) => toSearchString(search)),
        startWith('')
      )),
      map(([categories, filter]) => categories.filter((cat) => toSearchString(cat.label).includes(filter)))
    );
    const currentLang = this.evfCurrentLang;
    const templatesForCategory$ = this.formGroup.get('category')!.valueChanges.pipe(
      startWith(null),
      map((category) => category?.code === 'nursingCare' || !category ? this.templates : [])
    );
    this.templatesOptions$ = templatesForCategory$.pipe(
      combineLatestWith(this.formGroup.get('template')!.valueChanges.pipe(
        map((search) => toSearchString(search)),
        startWith('')
      )),
      map(([templates, filter]) => templates.filter((template) => toSearchString(template.labelTranslations[currentLang]!)?.includes(filter)))
    );
  }
}

const mustBeObjectValidator = (control: AbstractControl) => {
  return !control.value || typeof control.value === 'object'
    ? null
    : {pickOptionFromList: true}
}
