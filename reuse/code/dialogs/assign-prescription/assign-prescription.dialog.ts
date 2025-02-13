import { Component, Inject, OnInit, signal } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { debounceTime, of, switchMap } from 'rxjs';
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
import { Professional } from '../../interfaces';
import { GeographyService } from '../../services/geography.service';
import { ToastService } from '../../services/toast.service';
import { PrescriptionState } from '../../states/prescription.state';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { toDataState } from '../../utils/rxjs.utils';
import { HealthcareProviderService } from '../../services/healthcareProvider.service';
import { Organization } from '../../interfaces/organization.interface';
import { HealthcareProvider } from '../../interfaces/healthcareProvider.interface';
import { v4 as uuidv4 } from 'uuid';
import { ErrorCardComponent } from '../../components/error-card/error-card.component';
import { ErrorCard } from '../../interfaces/error-card.interface';
import { BaseDialog } from '../base.dialog';

interface AssignPrescriptionDialogData {
  prescriptionId?: string,
  referralTaskId?: string,
  assignedCareGivers?: string[],
  assignedOrganizations?: string[]
}

@Component({
  standalone: true,
  templateUrl: './assign-prescription.dialog.html',
  styleUrls: ['./assign-prescription.dialog.scss'],
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
    AsyncPipe,
    ErrorCardComponent
  ],
  providers: [
    provideNgxMask()
  ]
})
export class AssignPrescriptionDialog extends BaseDialog implements OnInit {

  private readonly nameValidators = [Validators.minLength(2), CaregiverNamePatternValidator];
  private readonly searchCriteria$ = signal<{ query: string, zipCodes: string[] }>({query: '', zipCodes: []});

  readonly healthcareProvidersState$ = toSignal(
    toObservable(this.searchCriteria$).pipe(
      switchMap((criteria) =>
        this.healthcareProviderService.findAll(
          criteria.query,
          criteria.zipCodes,
          ['NURSE'],
          ['THIRD_PARTY_PAYING_GROUP', 'GUARD_POST', 'MEDICAL_HOUSE', 'HOME_SERVICES']
        ).pipe(
          catchError((error) => {
            console.error('Error fetching healthcare providers:', error);
            return of([]);
          })
        )
      ),
      map((healthcareProvider) => healthcareProvider?.filter((hp) => {
        if (hp.type === 'Professional') {
          return !this.data.assignedCareGivers?.includes((hp as Professional).ssin)
        } else {
          return !this.data.assignedOrganizations?.includes((hp as Organization).nihdi!)
        }
      })),
      toDataState()
    )
  );

  readonly formGroup = new FormGroup({
    query: new FormControl<string>(''),
    cities: new FormControl<any[]>([]),
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
    private healthcareProviderService: HealthcareProviderService,
    private toastService: ToastService,
    private geographyService: GeographyService,
    dialogRef: MatDialogRef<AssignPrescriptionDialog>,
    @Inject(MAT_DIALOG_DATA) private data: AssignPrescriptionDialogData
  ) {
    super(dialogRef);
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

  assign(healthcareProvider: HealthcareProvider): void {
    if (!this.data?.prescriptionId) {
      this.closeDialog(healthcareProvider);
    } else {
      this.updatePrescription(healthcareProvider);
    }
  }

  private updatePrescription(healthcareProvider: HealthcareProvider): void {
    this.loading = true;

    this.prescriptionStateService.assignPrescriptionPerformer(this.data.prescriptionId!, this.data.referralTaskId!, healthcareProvider, this.generatedUUID)
      .subscribe({
        next: () => {
          this.closeErrorCard();
          if(healthcareProvider.type === 'Professional') {
            this.toastService.show('prescription.assignPerformer.success', {interpolation: healthcareProvider});
          }
          else{
            this.toastService.show('prescription.assignPerformer.successOrganization', {interpolation: healthcareProvider});
          }
          this.closeDialog(healthcareProvider);
        },
        error: (err) => {
          this.loading = false;
          this.showErrorCard('common.somethingWentWrong', err)
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
