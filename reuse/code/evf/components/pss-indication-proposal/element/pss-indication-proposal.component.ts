import { SelectionModel } from '@angular/cdk/collections';
import {
  ChangeDetectorRef,
  Component,
  computed,
  effect,
  inject,
  OnChanges,
  OnInit,
  signal,
  SimpleChanges,
  viewChild,
  WritableSignal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatChipGrid, MatChipRemove, MatChipRow } from '@angular/material/chips';
import { MatIcon } from '@angular/material/icon';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { TranslatePipe } from '@ngx-translate/core';
import { PaginatorComponent } from '@reuse/code/components/paginator/paginator.component';
import { FormatEnum, SkeletonComponent } from '@reuse/code/components/progress-indicators/skeleton/skeleton.component';
import { Lang } from '@reuse/code/constants/languages';
import {
  CodedValueItem,
  IndicationRadiology,
  RequestIndicationsRadiology,
  TranslatedFieldItem,
} from '@reuse/code/openapi';
import { PssService } from '@reuse/code/services/api/pss.service';
import { ToastService } from '@reuse/code/services/helpers/toast.service';
import { isEmptyValue } from '@reuse/code/utils/utils';
import {
  AutocompleteOption,
  ElementGroup,
  EvfTranslateService,
} from '@smals-belgium-shared/vas-evaluation-form-ui-core';
import {
  EvfBaseFormElementComponent,
  EvfElementBodyComponent,
  EvfElementHelpComponent,
  EvfElementLabelComponent,
  EvfFormElementLayoutComponent,
} from '@smals-belgium-shared/vas-evaluation-form-ui-material/elements/shared';
import { DateTime } from 'luxon';
import { distinctUntilChanged, startWith, takeUntil } from 'rxjs';

interface TableRow {
  value: string;
  name: string;
  criteriaValues: Map<string, string>;
}

interface AutocompleteLabel {
  nl: string;
  fr: string;
  de: string;
  en: string;
}

@Component({
  selector: 'pss-indication-proposal',
  imports: [
    MatCheckbox,
    TranslatePipe,
    PaginatorComponent,
    MatTableModule,
    MatSortModule,
    SkeletonComponent,
    EvfElementBodyComponent,
    EvfElementHelpComponent,
    EvfElementLabelComponent,
    EvfFormElementLayoutComponent,
    MatChipGrid,
    MatChipRow,
    MatChipRemove,
    MatIcon,
  ],
  templateUrl: './pss-indication-proposal.component.html',
  styleUrl: './pss-indication-proposal.component.scss',
})
export class PssIndicationProposalComponent extends EvfBaseFormElementComponent implements OnInit, OnChanges {
  private readonly pssService = inject(PssService);
  private readonly toastService = inject(ToastService);
  private readonly evfTranslate = inject(EvfTranslateService);
  protected readonly FormatEnum = FormatEnum;

  private static counter = 0;
  readonly id = `evf-pss-indication-proposal-${PssIndicationProposalComponent.counter++}`;
  private readonly REQUIRED_FIELDS = ['gender', 'birthdate', 'clinicalIndications'] as const;
  dataSource = new MatTableDataSource<TableRow>([]);
  selection = new SelectionModel<TableRow>(true, []);
  page = 0;
  pageSize = 10;

  rawIndications: WritableSignal<IndicationRadiology[] | undefined> = signal(undefined);
  indications = computed(() => {
    const raw = this.rawIndications();
    if (!raw) return undefined;

    const lang = this.currentLang();
    const criteria = this.criteriaOptions();

    return raw.map(o => this.mapToTableOption(o, lang, criteria));
  });

  readonly isLoading = signal(false);
  criteriaOptions: WritableSignal<AutocompleteOption[]> = signal([]);
  displayedColumns = computed(() => ['select', 'name', ...this.criteriaOptions().map((_, i) => `criteria${i + 1}`)]);
  totalRows = computed(() => this.indications()?.length);
  pageSizeOptions = computed(() => {
    const total = this.totalRows();
    if (!total) return [10];
    return total > 100 ? [10, 25, 50, 100] : [10, 25, 50];
  });

  private sortWired = false;

  sort = viewChild(MatSort);

  currentLang = toSignal(this.evfTranslate.currentLang$, {
    initialValue: this.evfTranslate.currentLang,
  });

  constructor(private readonly cdRef: ChangeDetectorRef) {
    super(cdRef);

    // wire up MatSort once it appears in the DOM
    effect(() => {
      const sort = this.sort();
      if (sort && !this.sortWired) {
        this.sortWired = true;
        this.dataSource.sort = sort;
        sort.sortChange.pipe(takeUntil(this.destroyed$)).subscribe(() => {
          this.page = 1;
          this.applyPagination();
        });
      }
    });

    // re-paginate whenever the mapped data changes (new results, lang change, criteria change)
    effect(() => {
      this.indications();
      this.applyPagination();
    });
  }

  ngOnInit() {
    this.watchFormUpdates();
  }

  override ngOnChanges(changes: SimpleChanges): void {
    super.ngOnChanges(changes);
    if (changes['elementControl']) {
      if (Array.isArray(this.elementControl.value) && this.elementControl.value.length > 0) {
        this.createRows();
        this.syncSelectionFromElementControlValue();
      }
    }
  }

  private watchFormUpdates() {
    this.elementControl.valueChanges
      .pipe(startWith(this.elementControl.value), distinctUntilChanged(), takeUntil(this.destroyed$))
      .subscribe(value => {
        if (value === null || value === undefined || (Array.isArray(value) && value.length === 0)) {
          this.selection.clear();
          this.createRows();
        }
      });
  }

  private createRows() {
    const formGroup = this.elementControl.elementGroup;
    if (formGroup) {
      const invalidFields = this.validateRequiredFields(formGroup, this.REQUIRED_FIELDS);

      if (invalidFields.length <= 0) {
        const formValues = (formGroup?.getOutputValue() as Record<string, unknown>) ?? {};
        const age = this.getAgeBasedOnBirthdate(formValues['birthdate'] as string);
        const gender = formValues['gender'] as string;
        const indication = formValues['clinicalIndications'] as AutocompleteOption[];

        this.controlAnnex82(age, gender, indication);
      }
    }
  }

  private initCriteriaOptions(): void {
    const targetId = this.element.custom?.['criteriaTarget'] as string | undefined;
    const targetControl = targetId ? this.elementControl.elementGroup?.get(targetId) : null;

    if (!targetControl) {
      this.criteriaOptions.set([] as AutocompleteOption[]);
      return;
    }

    this.criteriaOptions.set((targetControl.value ?? []) as AutocompleteOption[]);
  }

  private controlAnnex82(age: number, gender: string, indications: AutocompleteOption[]) {
    const codedValueItems = this.optionsToCodedValueItem(indications);
    const controlAnnex82Request = this.toRequestIndicationsRadiology(age, gender, codedValueItems);

    this.isLoading.set(true);
    this.pssService.getIndications(controlAnnex82Request).subscribe({
      next: result => {
        if (result.exchangeId) {
          this.elementControl.elementGroup?.get('exchangeId')?.setValue(result.exchangeId);
        }

        this.rawIndications.set(result.indications ?? []);
        this.initCriteriaOptions();
        this.syncSelectionFromElementControlValue();
        this.page = 1;
        this.isLoading.set(false);
      },
      error: () => {
        this.rawIndications.set(undefined);
        this.toastService.showSomethingWentWrong();
        this.isLoading.set(false);
      },
    });
  }

  private mapToTableOption(
    indicationRadiology: IndicationRadiology,
    lang: string,
    criteria: AutocompleteOption[]
  ): TableRow {
    const translation =
      indicationRadiology.translations.find(t => t.language.toUpperCase() === lang.toUpperCase()) ??
      indicationRadiology.translations.find(t => t.language.toUpperCase() === 'EN') ??
      indicationRadiology.translations[0];

    const langKey = lang.toLowerCase() as keyof AutocompleteLabel;
    const criteriaValues = new Map<string, string>();

    indicationRadiology.snomedcodes?.forEach(sc => {
      const match = criteria.find(c => c.value === sc.code);
      if (match) {
        criteriaValues.set(match.value as string, match.label[langKey] ?? match.label.en);
      }
    });

    return {
      value: indicationRadiology.id,
      name: translation?.value ?? '',
      criteriaValues,
    };
  }

  private optionsToCodedValueItem(options: AutocompleteOption[]) {
    return options.map(indication => {
      const translations: TranslatedFieldItem[] = [
        {
          value: indication.label.nl,
          language: 'NL',
        },
        {
          value: indication.label.fr,
          language: 'FR',
        },
        {
          value: indication.label.en,
          language: 'EN',
        },
        {
          value: indication.label.de,
          language: 'DE',
        },
      ];

      return {
        system: 'http://snomed.info/sct',
        code: indication.value as string,
        translations: translations,
      };
    });
  }

  private toRequestIndicationsRadiology(age: number, gender: string, indications: CodedValueItem[]) {
    //@todo fix intention when input is moved!
    return <RequestIndicationsRadiology>{
      age: age,
      gender: gender,
      indicationProposal: indications,
    };
  }

  private getAgeBasedOnBirthdate(birthdate: string) {
    const parsedBirthdate = DateTime.fromISO(birthdate);

    if (!parsedBirthdate.isValid) {
      return 0;
    }

    const age = DateTime.now().diff(parsedBirthdate, ['years']);
    return Math.floor(age.get('years'));
  }

  private validateRequiredFields(formGroup: ElementGroup, requiredFields: readonly string[]): string[] {
    const invalidFields: string[] = [];

    requiredFields.forEach(fieldName => {
      const control = formGroup.get(fieldName);

      if (isEmptyValue(control?.value)) {
        control?.markAsTouched();
        invalidFields.push(fieldName);
      }
    });
    return invalidFields;
  }

  isSelected(row: TableRow) {
    if (
      Array.isArray(this.elementControl.value) &&
      (this.elementControl.value as AutocompleteOption[]).map(e => e.value as string).includes(row.value)
    )
      return true;

    return this.selection.isSelected(row);
  }

  toggle(row: TableRow) {
    if (this.disabled) return;
    this.selection.toggle(row);
    this.emitChange();
  }

  remove(row: TableRow) {
    this.selection.toggle(row);
    this.emitChange();
  }

  private emitChange() {
    this.onChange(this.selection.selected);
  }

  private syncSelectionFromElementControlValue(): void {
    if (!Array.isArray(this.elementControl.value)) {
      this.selection.clear();
      return;
    }

    const selectedRows = this.toTableRows(this.elementControl.value as AutocompleteOption[]);
    this.selection.clear();

    if (selectedRows.length > 0) {
      this.selection.select(...selectedRows);
    }
  }

  private toTableRows(values: AutocompleteOption[]): TableRow[] {
    const rows = this.indications() ?? [];
    const selectedValues = new Set(values.map(value => value.value as string));
    return rows.filter(row => selectedValues.has(row.value));
  }

  onChange(values: TableRow[]) {
    const autocompleteOptions = this.toAutoCompleteOption(values);
    this.elementControl.setValue(autocompleteOptions);
    this.elementControl.markAsTouched();
    this.events.emit({ type: 'CLICK_OPTIONS', data: autocompleteOptions });
  }

  private toAutoCompleteOption(tableRows: TableRow[]): AutocompleteOption[] {
    const indications = this.rawIndications();
    if (!indications) {
      return [];
    }

    return tableRows.reduce<AutocompleteOption[]>((options, row) => {
      const indication = indications.find(item => item.id === row.value);
      if (!indication) {
        return options;
      }

      options.push({
        value: indication.id,
        label: this.toAutocompleteLabel(indication.translations, row.name),
      });

      return options;
    }, []);
  }

  private toAutocompleteLabel(translations: TranslatedFieldItem[], fallback = ''): AutocompleteLabel {
    const preferredFallback =
      this.findTranslationValue(translations, Lang.EN.capital) ?? translations[0]?.value ?? fallback;

    return {
      nl: this.findTranslationValue(translations, Lang.NL.capital) ?? preferredFallback,
      fr: this.findTranslationValue(translations, Lang.FR.capital) ?? preferredFallback,
      de: this.findTranslationValue(translations, Lang.DE.capital) ?? preferredFallback,
      en: this.findTranslationValue(translations, Lang.EN.capital) ?? preferredFallback,
    };
  }

  private findTranslationValue(translations: TranslatedFieldItem[], language: string): string | undefined {
    return translations.find(translation => translation.language.toUpperCase() === language.toUpperCase())?.value;
  }

  changePage(event: { pageIndex?: number; pageSize?: number }) {
    this.page = event.pageIndex ?? this.page;
    this.pageSize = event.pageSize ?? this.pageSize;
    this.applyPagination();
  }

  private applyPagination(): void {
    const sort = this.sort();
    let data = this.indications() ?? [];

    if (sort?.active && sort.direction) {
      data = this.sortData(data, sort.active, sort.direction);
    }

    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.dataSource.data = data.slice(start, end);
  }

  private sortData(data: TableRow[], active: string, direction: 'asc' | 'desc'): TableRow[] {
    const factor = direction === 'asc' ? 1 : -1;
    return [...data].sort((a, b) => {
      const valueA = this.getSortValue(a, active);
      const valueB = this.getSortValue(b, active);
      return valueA.localeCompare(valueB) * factor;
    });
  }

  private getSortValue(row: TableRow, sortHeaderId: string): string {
    if (sortHeaderId === 'name') return row.name;
    const match = sortHeaderId.match(/^criteria(\d+)$/);
    if (match) {
      const index = Number(match[1]) - 1;
      const criteria = this.criteriaOptions()[index];
      return criteria ? (row.criteriaValues.get(criteria.value as string) ?? '') : '';
    }
    return '';
  }

  getSortIcon(columnId: string): string {
    const sort = this.sort();
    if (sort?.active !== columnId || !sort.direction) {
      return 'swap_vert';
    }
    return sort.direction === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }
}
