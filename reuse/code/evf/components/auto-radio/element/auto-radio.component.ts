import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  DestroyRef,
  Inject,
  inject,
  OnInit,
  Optional,
  signal,
  WritableSignal,
} from '@angular/core';
import { catchError, tap } from 'rxjs/operators';
import {
  AutocompleteError,
  AutocompleteOption,
  EvfLabelPipe,
  EvfTranslateService,
} from '@smals-belgium-shared/vas-evaluation-form-ui-core';
import { of } from 'rxjs';
import { ExternalSourceService } from '@reuse/code/services/api/externalSourceService.service';
import {
  EvfBaseFormElementComponent,
  EvfElementBodyComponent,
  EvfElementHelpComponent,
  EvfElementLabelComponent,
  EvfElementSubLabelComponent,
  EvfFormElementLayoutComponent,
} from '@smals-belgium-shared/vas-evaluation-form-ui-material/elements/shared';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatRadioChange, MatRadioModule } from '@angular/material/radio';
import { EVF_MATERIAL_OPTIONS, EvfMaterialOptions } from '@smals-belgium-shared/vas-evaluation-form-ui-material';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'evf-auto-radio',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule,
    EvfLabelPipe,
    EvfFormElementLayoutComponent,
    EvfElementLabelComponent,
    EvfElementBodyComponent,
    EvfElementHelpComponent,
    EvfElementSubLabelComponent,
    MatRadioModule,
    MatIconModule,
  ],
  templateUrl: './auto-radio.component.html',
  styleUrl: './auto-radio.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutoRadioComponent extends EvfBaseFormElementComponent implements OnInit {
  private readonly externalSourceService = inject(ExternalSourceService);
  private readonly announcer = inject(LiveAnnouncer);
  private readonly evfTranslate = inject(EvfTranslateService);
  private readonly destroyRef = inject(DestroyRef);

  radioColor: 'primary' | 'accent';

  private static counter = 0;
  readonly id = 'evf-auto-radio-' + AutoRadioComponent.counter++;
  rawOptions: WritableSignal<AutocompleteOption[] | AutocompleteError | undefined> = signal(undefined);

  autoCompleteOptions = computed(() => {
    const options = this.rawOptions();

    if (Array.isArray(options)) return options;

    return undefined;
  });

  protected currentLang = toSignal(this.evfTranslate.currentLang$, {
    initialValue: this.evfTranslate.currentLang,
  });

  readonly selectedItem = signal<AutocompleteOption | undefined>(undefined);

  constructor(
    private readonly cdRef: ChangeDetectorRef,
    @Optional() @Inject(EVF_MATERIAL_OPTIONS) matOptions?: EvfMaterialOptions
  ) {
    super(cdRef, matOptions);

    this.radioColor = matOptions?.radioColor || 'accent';
  }

  ngOnInit() {
    this.setOptionsStream();
  }

  setOptionsStream() {
    if (!this.element.externalSource) {
      return;
    }

    this.externalSourceService
      .handleSelectOptions(this.element.externalSource)
      .pipe(
        tap((options: AutocompleteOption[]) => this.autoSelectOption(options)),
        catchError(err =>
          of({
            translate: err instanceof Error ? err.message : 'FAILED_TO_GET_AUTOCOMPLETE_OPTIONS',
          })
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(options => {
        this.rawOptions.set(options);
        this.markForCheck();
      });
  }

  private autoSelectOption(options: AutocompleteOption[]): void {
    if (options?.length === 1) {
      const optionToSelect = options[0];

      this.selectedItem.set(optionToSelect);
      void this.addAnnouncer(`added ${options[0].label[this.evfTranslate.currentLang]}`);

      if (this.control) {
        this.control.setValue(this.selectedItem());
        this.control.markAsDirty();
      }
    }
  }

  private async addAnnouncer(label: string) {
    await this.announcer.announce(label);
  }

  clickRadio(response: AutocompleteOption): void {
    if (this.disabled) {
      return;
    }
    this.control.markAsTouched();
    if (this.control.value === response.value) {
      setTimeout(() => {
        this.control.setValue(null);
      });
    }
  }

  userChangeOption(change: MatRadioChange): void {
    this.events.emit({ type: 'CLICK_OPTION', data: { value: change.value as string } });
  }

  toErrorObject(options: AutocompleteOption[] | AutocompleteError): AutocompleteError {
    return options as AutocompleteError;
  }
}
