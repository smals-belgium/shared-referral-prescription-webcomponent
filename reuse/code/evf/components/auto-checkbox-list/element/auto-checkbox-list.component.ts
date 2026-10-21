import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
  WritableSignal,
} from '@angular/core';
import {
  EvfBaseFormElementComponent,
  EvfElementBodyComponent,
  EvfElementHelpComponent,
  EvfElementLabelComponent,
  EvfElementSubLabelComponent,
  EvfFormElementLayoutComponent,
} from '@smals-belgium-shared/vas-evaluation-form-ui-material/elements/shared';
import {
  AutocompleteError,
  AutocompleteOption,
  EvfLabelPipe,
  EvfTranslateService,
} from '@smals-belgium-shared/vas-evaluation-form-ui-core';
import { MatError } from '@angular/material/form-field';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { ExternalSourceService } from '@reuse/code/services/api/externalSourceService.service';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'evf-auto-checkbox-list',
  imports: [
    EvfFormElementLayoutComponent,
    EvfElementLabelComponent,
    EvfLabelPipe,
    EvfElementSubLabelComponent,
    EvfElementBodyComponent,
    EvfElementHelpComponent,
    MatError,
    MatCheckboxModule,
    MatIcon,
  ],
  templateUrl: './auto-checkbox-list.component.html',
  styleUrl: './auto-checkbox-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutoCheckboxListComponent extends EvfBaseFormElementComponent implements OnInit {
  private readonly externalSourceService = inject(ExternalSourceService);
  private readonly announcer = inject(LiveAnnouncer);
  private readonly evfTranslate = inject(EvfTranslateService);
  private readonly destroyRef = inject(DestroyRef);

  private static counter = 0;
  readonly id = 'evf-auto-checkbox-list-' + AutoCheckboxListComponent.counter++;

  protected currentLang = toSignal(this.evfTranslate.currentLang$, {
    initialValue: this.evfTranslate.currentLang,
  });
  rawOptions: WritableSignal<AutocompleteOption[] | AutocompleteError | undefined> = signal(undefined);

  autoCompleteOptions = computed(() => {
    const options = this.rawOptions();

    if (Array.isArray(options)) return options;

    return undefined;
  });

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
      void this.addAnnouncer(`added ${options[0].label[this.evfTranslate.currentLang]}`);

      if (this.control) {
        this.control.setValue(options);
        this.control.markAsDirty();
      }
    }
  }

  private async addAnnouncer(label: string) {
    await this.announcer.announce(label);
  }

  checkChanged(event: MatCheckboxChange, response: AutocompleteOption): void {
    const currentValues = (this.elementControl.value || []) as AutocompleteOption[];
    const isChecked = event.checked;

    if (isChecked) {
      const valueToAdd = response;
      this.elementControl.setValue(this.sortValues([...currentValues, valueToAdd]));
    } else {
      const updated = currentValues.filter(v => v.value != response.value);
      this.elementControl.setValue(updated);
    }

    this.elementControl.markAsTouched();
    this.events.emit({ type: 'CLICK_OPTION', data: { value: response.value as string } });
  }

  private sortValues(values: AutocompleteOption[]): AutocompleteOption[] {
    return values.sort((a, b) => (a.value < b.value ? -1 : 1));
  }

  isChecked(value: string): boolean {
    if (!this.control) return false;
    const options = this.control.value as AutocompleteOption[];
    if (!options) return false;
    const optionValus = options.map(v => v.value as string);
    return optionValus.includes(value);
  }

  toErrorObject(options: AutocompleteOption[] | AutocompleteError): AutocompleteError {
    return options as AutocompleteError;
  }
}
