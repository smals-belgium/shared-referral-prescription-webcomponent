import { Component, Inject, OnInit, signal } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { debounceTime, Observable, of, switchMap } from 'rxjs';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { catchError, map } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { IfStatusErrorDirective } from '../../directives/if-status-error.directive';
import { IfStatusLoadingDirective } from '../../directives/if-status-loading.directive';
import { IfStatusSuccessDirective } from '../../directives/if-status-success.directive';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormatNihdiPipe } from '../../pipes/format-nihdi.pipe';
import { TranslationPipe } from '../../pipes/translation.pipe';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { MatInputModule } from '@angular/material/input';
import { OverlaySpinnerComponent } from '../../components/overlay-spinner/overlay-spinner.component';
import { CaregiverNamePatternValidator } from '../../utils/validators';
import { City, DataState, Professional } from '../../interfaces';
import { GeographyService } from '../../services/geography.service';
import { ToastService } from '../../services/toast.service';
import { PrescriptionState } from '../../states/prescription.state';
import { toObservable } from '@angular/core/rxjs-interop';
import { ProfessionalService } from '../../services/professional.service';
import { toDataState } from '../../utils/rxjs.utils';
import { v4 as uuidv4 } from 'uuid';

interface TransferAssignation {
  prescriptionId?: string,
  referralTaskId?: string,
  performerTaskId?: string,
  assignedCareGivers?: string[]
}

@Component({
  standalone: true,
  templateUrl: './transfer-assignation.dialog.html',
  styleUrls: ['./transfer-assignation.dialog.scss'],
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    NgxMaskDirective,
    MatDialogModule,
    MatButtonModule,
    MatChipsModule,
    TranslateModule,
    MatAutocompleteModule,
    MatIconModule,
    OverlaySpinnerComponent,
    IfStatusLoadingDirective,
    IfStatusErrorDirective,
    IfStatusSuccessDirective,
    TranslationPipe,
    FormatNihdiPipe,
    NgIf,
    NgFor,
    AsyncPipe
  ],
  providers: [
    provideNgxMask()
  ]
})
export class TransferAssignationDialog implements OnInit {

  private readonly nameValidators = [Validators.minLength(2), CaregiverNamePatternValidator];
  private readonly searchCriteria$ = signal<{ query: string, zipCodes: string[] }>({query: '', zipCodes: []});

  readonly professionalsState$: Observable<DataState<Professional[]>> = toObservable(this.searchCriteria$).pipe(
    switchMap((criteria) => this.professionalService.findAll(criteria.query, criteria.zipCodes, ['NURSE'])),
    map((professionals) => professionals?.filter((p) => !this.data.assignedCareGivers?.includes(p.ssin!))),
    toDataState()
  );
  readonly formGroup = new FormGroup({
    query: new FormControl<string>(''),
    cities: new FormControl<City[]>([]),
    searchCity: new FormControl<string>('')
  });
  readonly cityOptions$ = this.formGroup.get('searchCity')!.valueChanges.pipe(
    debounceTime(400),
    switchMap((query: string | null) => query?.length! > 1
      ? this.geographyService.findAll(query!).pipe(catchError(() => of([])))
      : of(null))
  );
  readonly caregiverNameMaxLength = 50;
  queryIsNumeric = false;
  loading = false;
  generatedUUID = '';

  constructor(
    private prescriptionStateService: PrescriptionState,
    private professionalService: ProfessionalService,
    private toastService: ToastService,
    private geographyService: GeographyService,
    private dialogRef: MatDialogRef<TransferAssignationDialog>,
    @Inject(MAT_DIALOG_DATA) private data: TransferAssignation
  ) {
    this.setValidators();
  }

  ngOnInit() {
    this.generatedUUID = uuidv4();
  }

  private setValidators(): void {
    this.formGroup.get('query')!.setValidators([
        (control: AbstractControl) => this.formGroup.get('cities')!.value!.length === 0
          ? Validators.required(control)
          : null
      ]
    );
    this.formGroup.get('query')!.addValidators(this.nameValidators);

    this.formGroup.get('cities')!.setValidators(
      (control: AbstractControl) => Validators.required(this.formGroup.get('query')!) != null
        ? Validators.required(control) || Validators.minLength(1)(control)
        : null
    );
  }

  search(): void {
    this.formGroup.markAllAsTouched();
    if (this.formGroup.valid) {
      const values = this.formGroup.value;
      const zipCodes = values.cities?.map(c => c.zipCode) || [];
      this.searchCriteria$.set({
        query: values.query!,
        zipCodes
      });
    }
  }

  onKeyUp(event: KeyboardEvent) {
    this.formGroup.get('cities')!.updateValueAndValidity();
    this.updateQueryTypeAndValidators(event);
  }

  private updateQueryTypeAndValidators(event: KeyboardEvent) {
    const oldQueryIsNumeric = this.queryIsNumeric;
    const inputValue = (event.target as HTMLInputElement).value;
    this.queryIsNumeric = !!inputValue && !Number.isNaN(Number(inputValue?.substring(0, 1)));
    if (this.queryIsNumeric !== oldQueryIsNumeric) {
      const control = this.formGroup.get('query')!;
      if (this.queryIsNumeric) {
        control.removeValidators(this.nameValidators);
      } else {
        control.addValidators(this.nameValidators);
      }
    }
  }

  assign(professional: Professional): void {
    if (!this.data?.prescriptionId) {
      this.dialogRef.close(professional);
    } else {
      this.updatePrescription(professional);
    }
  }

  private updatePrescription(professional: Professional): void {
    this.loading = true;
    this.prescriptionStateService.transferAssignation(this.data.prescriptionId!, this.data.referralTaskId!, this.data.performerTaskId!, professional, this.generatedUUID)
      .subscribe({
        next: () => {
          this.toastService.show('prescription.assignPerformer.success', {interpolation: professional});
          this.dialogRef.close(professional);
        },
        error: () => {
          this.loading = false;
          this.toastService.showSomethingWentWrong();
        }
      });
  }

  removeCity(city: any) {
    const control = this.formGroup.get('cities')!;
    const updated = control.value?.filter(c => c !== city) || [];
    control.setValue(updated);
    this.formGroup.get('query')!.updateValueAndValidity();
  }

  addCity(event: MatAutocompleteSelectedEvent, searchInput: HTMLInputElement) {
    if (!event.option.value) {
      return;
    }
    const control = this.formGroup.get('cities')!;
    const value = [...(control.value || [])].filter(v => v.zipCode !== event.option.value.zipCode);
    value.push(event.option.value);
    control.setValue(value);
    searchInput.value = '';
    this.formGroup.get('query')!.updateValueAndValidity();
  }
}
