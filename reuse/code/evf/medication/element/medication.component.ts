import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnInit,
  Optional,
  ViewChild
} from '@angular/core';
import {
  EvfBaseFormElementComponent,
  EvfElementBodyComponent,
  EvfElementHelpComponent,
  EvfElementLabelComponent,
  EvfFormElementLayoutComponent
} from '@smals/vas-evaluation-form-ui-material/elements/shared';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { debounceTime, filter, merge, Observable, of, Subject, switchMap } from 'rxjs';
import { MedicationService } from '../../../services/medication.service';
import { MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import {
  AutocompleteError,
  AutocompleteOption,
  EvfCommonErrorsPipe,
  EvfLabelPipe,
  EvfTranslateService,
  Language
} from '@smals/vas-evaluation-form-ui-core';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
import { catchError, map, tap } from 'rxjs/operators';
import { MedicationResults } from '../../../interfaces/medication.interface';
import { MatIconModule } from '@angular/material/icon';
import { EVF_MATERIAL_OPTIONS, EvfMaterialOptions } from '@smals/vas-evaluation-form-ui-material';

@Component({
    selector: 'evf-medication',
    templateUrl: './medication.component.html',
    styleUrls: ['./medication.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        EvfFormElementLayoutComponent,
        EvfElementLabelComponent,
        EvfElementBodyComponent,
        EvfElementHelpComponent,
        MatFormFieldModule,
        MatInputModule,
        ReactiveFormsModule,
        TranslateModule,
        MatAutocompleteModule,
        EvfLabelPipe,
        EvfCommonErrorsPipe,
        AsyncPipe,
        MatIconModule,
        NgIf,
        NgForOf
    ]
})
export class MedicationComponent extends EvfBaseFormElementComponent implements OnInit {

  private static counter = 0;
  private readonly queryTrigger$ = new Subject<string>();
  private lastValue?: string;
  private readonly autoSelectInAutocomplete = false;

  readonly id = 'evf-medication-' + MedicationComponent.counter++;
  options$!: Observable<AutocompleteOption[] | AutocompleteError>;

  @ViewChild(MatAutocompleteTrigger, {static: true}) autocompleteTrigger!: MatAutocompleteTrigger;

  displayWith = (option: AutocompleteOption | string) => typeof option === 'string' ? option : option?.label[this.evfTranslate.currentLang] ?? '';

  constructor(
    private readonly medicationService: MedicationService,
    private readonly evfTranslate: EvfTranslateService,
    cdRef: ChangeDetectorRef,
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

  updateQuery(event: any): void {
    const value = event.target.value as string;
    if (this.lastValue !== value) {
      this.lastValue = value;
      this.queryTrigger$.next(value);
    }
  }

  updateQueryOnPaste(event: any): void {
    const value = event.clipboardData && event.clipboardData.getData('text') as string;
    if (value?.length && this.lastValue !== value) {
      this.lastValue = value;
      this.queryTrigger$.next(value);
    }
  }

  private setOptionsStream(): void {
    const controlCleared$ = this.control.valueChanges
      .pipe(filter((v) => v == null));
    this.options$ = merge(this.queryTrigger$, controlCleared$)
      .pipe(
        debounceTime(600),
        switchMap((value) => value == null ? of(null) : this.medicationService
          .findAll(value)
          .pipe(
            map((result) => this.toAutocompleteOptions(result)),
            tap((options: AutocompleteOption[]) => this.autoSelectOption(options)),
            catchError((err) => of(err?.translate
              ? err
              : {translate: 'FAILED_TO_GET_AUTOCOMPLETE_OPTIONS'}
            ))
          )
        )
      ) as Observable<AutocompleteOption[] | AutocompleteError>;
  }

  private toAutocompleteOptions(result: MedicationResults): AutocompleteOption[] {
    return Object.values(result.result).map((value) => ({
      label: value['amp']['ampp']['prescriptionName'],
      value
    }));
  }

  private autoSelectOption(options: AutocompleteOption[]) {
    if (this.autoSelectInAutocomplete && options && options.length === 1) {
      this.control.setValue(options[0]);
      this.autocompleteTrigger.closePanel();
    }
  }

  toErrorObject(options: AutocompleteOption[] | AutocompleteError): AutocompleteError {
    return options as AutocompleteError;
  }

  toAutocompleteOptionList(options: AutocompleteOption[] | AutocompleteError): AutocompleteOption[] {
    return options as AutocompleteOption[];
  }
}
