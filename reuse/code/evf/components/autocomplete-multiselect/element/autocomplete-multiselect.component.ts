import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  Inject,
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
import { MatOptionModule } from '@angular/material/core';
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
import { debounceTime, filter, merge, Observable, of, Subject, switchMap } from 'rxjs';
import { EVF_MATERIAL_OPTIONS, EvfMaterialOptions } from '@smals-belgium-shared/vas-evaluation-form-ui-material';
import { catchError, tap } from 'rxjs/operators';
import { MatChipsModule } from '@angular/material/chips';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { isEmptyValue } from '@reuse/code/utils/utils';

@Component({
  selector: 'autocomplete-multiselect',
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
  ],
  templateUrl: './autocomplete-multiselect.component.html',
  styleUrl: './autocomplete-multiselect.component.scss',
})
export class AutocompleteMultiselectComponent extends EvfBaseFormElementComponent implements OnInit, OnChanges {
  private static counter = 0;
  private queryTrigger$ = new Subject<string>();
  private lastValue: string | undefined;
  private autoSelectInAutocomplete = false;

  readonly id = 'evf-autocomplete-' + AutocompleteMultiselectComponent.counter++;
  options$: Observable<AutocompleteOption[] | AutocompleteError | null> | undefined;
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];

  readonly selectedItems = signal<AutocompleteOption[]>([]);

  readonly announcer = inject(LiveAnnouncer);

  searchControl = new FormControl(''); // For the search input

  @ViewChild(MatAutocompleteTrigger, { static: true }) autocompleteTrigger: MatAutocompleteTrigger | undefined;
  @ViewChild('itemInput') inputField!: ElementRef<HTMLInputElement>;

  displayWith = (option: { label: { [x: string]: unknown } } | null | undefined) =>
    option && option.label && typeof option.label[this.evfTranslate.currentLang] === 'string'
      ? (option.label[this.evfTranslate.currentLang] as string)
      : '';

  constructor(
    private cdRef: ChangeDetectorRef,
    private evfTranslate: EvfTranslateService,
    private externalSourceService: EvfExternalSourceService,
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
    const value = event.clipboardData && event.clipboardData.getData('text');
    if (value?.length && this.lastValue !== value) {
      this.lastValue = value;
      this.queryTrigger$.next(value);
    }
  }

  private setOptionsStream(): void {
    if (this.element.externalSource) {
      const controlCleared$ = this.control.valueChanges.pipe(filter(v => v == null));
      this.options$ = merge(this.queryTrigger$, controlCleared$).pipe(
        debounceTime(300),
        switchMap(value =>
          isEmptyValue(value)
            ? of(null)
            : this.externalSourceService
                .handleAutocomplete(
                  this.element.externalSource!,
                  JSON.stringify({
                    query: value,
                    formValues: this.elementControl.elementGroup?.value,
                    selectedValues: this.selectedItems(),
                  })
                )
                .pipe(
                  tap((options: AutocompleteOption[]) => this.autoSelectOption(options)),
                  catchError(err =>
                    of({
                      translate: err instanceof Error ? err.message : 'FAILED_TO_GET_AUTOCOMPLETE_OPTIONS',
                    } as AutocompleteError)
                  )
                )
        )
      );
    }
  }

  private async autoSelectOption(options: AutocompleteOption[]) {
    if (this.autoSelectInAutocomplete && options && options.length === 1) {
      this.selectedItems.update(options => [...options, options[0]]);
      this.addAnnouncer(`added ${options[0].label[this.evfTranslate.currentLang]}`);

      if (this.control) {
        this.control.setValue(this.selectedItems());
        this.control.markAsDirty();
      }

      this.autocompleteTrigger!.closePanel();
    }
  }

  remove(item: AutocompleteOption): void {
    this.selectedItems.update(items => {
      const filteredItems = items.filter(i => i.value !== item.value);
      this.addAnnouncer(`Removed ${item.label[this.evfTranslate.currentLang]}`);
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
    const option = event.option.value;
    if (!option) {
      return;
    }
    this.selectedItems.update(options => [...options, option]);
    this.addAnnouncer(`added ${option.label[this.evfTranslate.currentLang]}`);

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

  toAutocompleteOptionList(options: AutocompleteOption[] | AutocompleteError): AutocompleteOption[] {
    return options as AutocompleteOption[];
  }
}
