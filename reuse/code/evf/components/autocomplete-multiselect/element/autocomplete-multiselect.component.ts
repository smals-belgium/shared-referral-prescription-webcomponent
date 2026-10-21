import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  Inject,
  Injector,
  OnChanges,
  OnInit,
  Optional,
  signal,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {
  EvfBaseFormElementComponent,
  EvfElementBodyComponent,
  EvfElementHelpComponent,
  EvfElementLabelComponent,
  EvfFormElementLayoutComponent,
} from '@smals-belgium-shared/vas-evaluation-form-ui-material/elements/shared';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
  MatAutocompleteTrigger,
} from '@angular/material/autocomplete';
import { ErrorStateMatcher, MatOptionModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { AsyncPipe } from '@angular/common';
import {
  AutocompleteError,
  AutocompleteOption,
  EvfCommonErrorsPipe,
  EvfExternalSourceService,
  EvfLabelPipe,
  EvfTranslateService,
  Language,
} from '@smals-belgium-shared/vas-evaluation-form-ui-core';
import { combineLatest, debounceTime, filter, merge, Observable, of, Subject, switchMap } from 'rxjs';
import { EVF_MATERIAL_OPTIONS, EvfMaterialOptions } from '@smals-belgium-shared/vas-evaluation-form-ui-material';
import { catchError, map, tap } from 'rxjs/operators';
import { MatChipsModule } from '@angular/material/chips';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { isEmptyValue } from '@reuse/code/utils/utils';
import { TranslatePipe } from '@ngx-translate/core';
import { toObservable } from '@angular/core/rxjs-interop';

@Component({
  selector: 'evf-autocomplete-multiselect',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatAutocompleteModule,
    ReactiveFormsModule,
    MatOptionModule,
    MatIconModule,
    AsyncPipe,
    EvfLabelPipe,
    EvfCommonErrorsPipe,
    EvfFormElementLayoutComponent,
    EvfElementLabelComponent,
    EvfElementBodyComponent,
    EvfElementHelpComponent,
    MatChipsModule,
    TranslatePipe,
  ],
  templateUrl: './autocomplete-multiselect.component.html',
  styleUrl: './autocomplete-multiselect.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutocompleteMultiselectComponent extends EvfBaseFormElementComponent implements OnInit, OnChanges {
  private readonly injector = inject(Injector);
  private readonly evfTranslate = inject(EvfTranslateService);
  private readonly externalSourceService = inject(EvfExternalSourceService);

  private static counter = 0;
  private readonly queryTrigger$ = new Subject<string>();
  private lastValue: string | undefined;
  private autoSelectInAutocomplete = false;
  private minimumQueryLength = 0;

  readonly id = 'evf-multiselect-autocomplete-' + AutocompleteMultiselectComponent.counter++;
  options$: Observable<AutocompleteOption[] | AutocompleteError | null> | undefined;

  readonly selectedItems = signal<AutocompleteOption[]>([]);

  readonly announcer = inject(LiveAnnouncer);

  searchControl = new FormControl(''); // For the search input

  @ViewChild(MatAutocompleteTrigger, { static: true }) autocompleteTrigger: MatAutocompleteTrigger | undefined;
  @ViewChild('itemInput') inputField!: ElementRef<HTMLInputElement>;

  displayWith = (option: { label: { [x: string]: unknown } } | null | undefined) => {
    const label = option?.label?.[this.evfTranslate.currentLang];
    return typeof label === 'string' ? label : '';
  };

  constructor(
    private readonly cdRef: ChangeDetectorRef,
    @Optional() @Inject(EVF_MATERIAL_OPTIONS) matOptions?: EvfMaterialOptions
  ) {
    super(cdRef, matOptions);
  }

  get currentLang(): Language {
    return this.evfTranslate.currentLang;
  }

  ngOnInit() {
    this.setOptionsStream();
  }

  override ngOnChanges(changes: SimpleChanges): void {
    super.ngOnChanges(changes);
    if (changes['elementControl']) {
      this.autoSelectInAutocomplete = !!this.element?.custom?.['autoSelect'];
      this.minimumQueryLength = this.getMinimumQueryLength();
      if (Array.isArray(this.elementControl.value)) {
        this.selectedItems.set(this.elementControl.value as AutocompleteOption[]);
      }
    }
  }

  updateQuery(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (this.lastValue !== value) {
      this.lastValue = value;
      this.queryTrigger$.next(value);
    }
  }

  updateQueryOnPaste(event: ClipboardEvent): void {
    const value = event.clipboardData?.getData('text');
    if (value?.length && this.lastValue !== value) {
      this.lastValue = value;
      this.queryTrigger$.next(value);
    }
  }

  private setOptionsStream(): void {
    if (this.element.externalSource) {
      const controlCleared$ = this.control.valueChanges.pipe(filter(v => v == null));

      const fetchedOptions$ = merge(this.queryTrigger$, controlCleared$).pipe(
        debounceTime(300),
        switchMap(value => {
          const query = typeof value === 'string' ? value.trim() : '';

          if (isEmptyValue(query) || query.length < this.minimumQueryLength) {
            return of(null);
          }

          return this.externalSourceService
            .handleAutocomplete(
              this.element.externalSource!,
              JSON.stringify({
                query,
                formValues: this.elementControl.elementGroup?.value,
                selectedValues: this.selectedItems(),
              })
            )
            .pipe(
              tap((options: AutocompleteOption[]) => this.autoSelectOption(options)),
              catchError(err =>
                of({
                  translate: err instanceof Error ? err.message : 'FAILED_TO_GET_AUTOCOMPLETE_OPTIONS',
                })
              )
            );
        })
      );

      this.options$ = combineLatest([
        fetchedOptions$,
        toObservable(this.selectedItems, { injector: this.injector }),
      ]).pipe(
        map(([options, selected]) => {
          if (options == null || 'translate' in options) {
            return options;
          }
          return this.excludeSelectedOptions(options, selected);
        })
      );
    }
  }

  private excludeSelectedOptions(options: AutocompleteOption[], selected: AutocompleteOption[]): AutocompleteOption[] {
    const selectedIds = new Set(selected.map(item => item.value));
    return options.filter(option => !selectedIds.has(option.value));
  }

  private getMinimumQueryLength(): number {
    const minLengthExternalSource = this.element?.custom?.['minLengthExternalSource'] as unknown;

    const minLength = Number(minLengthExternalSource);

    return Number.isFinite(minLength) && minLength > 0 ? Math.floor(minLength) : 0;
  }

  private autoSelectOption(options: AutocompleteOption[]): void {
    if (this.autoSelectInAutocomplete && options?.length === 1) {
      const optionToSelect = options[0];

      this.selectedItems.update((selectedItems: AutocompleteOption[]) => [...selectedItems, optionToSelect]);
      void this.addAnnouncer(`added ${options[0].label[this.evfTranslate.currentLang]}`);

      if (this.control) {
        this.control.setValue(this.selectedItems());
        this.control.markAsDirty();
      }

      this.autocompleteTrigger!.closePanel();
    }
  }

  remove(item: AutocompleteOption): void {
    this.selectedItems.update((items: AutocompleteOption[]) => {
      const filteredItems = items.filter(i => i.value !== item.value);
      void this.addAnnouncer(`Removed ${item.label[this.evfTranslate.currentLang]}`);
      return filteredItems;
    });

    if (this.control) {
      this.control.setValue(this.selectedItems());
      this.control.markAsDirty();
    }

    this.autocompleteTrigger!.closePanel();
  }

  async addAnnouncer(label: string) {
    await this.announcer.announce(label);
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    const option = event.option.value as unknown;

    if (!this.isAutocompleteOption(option)) {
      return;
    }

    this.selectedItems.update((options: AutocompleteOption[]) => [...options, option]);
    void this.addAnnouncer(`added ${option.label[this.evfTranslate.currentLang]}`);

    if (this.control) {
      this.control.setValue(this.selectedItems());
      this.control.markAsDirty();
    }

    event.option.deselect();
    this.autocompleteTrigger!.closePanel();
  }

  toErrorObject(options: AutocompleteOption[] | AutocompleteError): AutocompleteError {
    return options as AutocompleteError;
  }

  customErrorMatcher: ErrorStateMatcher = {
    isErrorState: (): boolean => {
      return !!(this.control && this.control.invalid && (this.control.dirty || this.control.touched));
    },
  };

  toAutocompleteOptionList(options: AutocompleteOption[] | AutocompleteError): AutocompleteOption[] {
    return options as AutocompleteOption[];
  }

  private isAutocompleteOption(value: unknown): value is AutocompleteOption {
    return typeof value === 'object' && value !== null && 'label' in value && 'value' in value;
  }
}
