import { Component, Inject, OnInit, signal } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { debounceTime, Observable, of, switchMap } from 'rxjs';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { catchError, map } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { IfStatusLoadingDirective } from '@reuse/code/directives/if-status-loading.directive';
import { IfStatusSuccessDirective } from '@reuse/code/directives/if-status-success.directive';
import { AsyncPipe } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormatNihdiPipe } from '@reuse/code/pipes/format-nihdi.pipe';
import { TranslationPipe } from '@reuse/code/pipes/translation.pipe';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { MatInputModule } from '@angular/material/input';
import { OverlaySpinnerComponent } from '@reuse/code/components/progress-indicators/overlay-spinner/overlay-spinner.component';
import { CaregiverNamePatternValidator } from '@reuse/code/utils/validators';
import { AlertType, DataState, Intent } from '@reuse/code/interfaces';
import { GeographyService } from '@reuse/code/services/api/geography.service';
import { ToastService } from '@reuse/code/services/helpers/toast.service';
import { PrescriptionState } from '@reuse/code/states/api/prescription.state';
import { toObservable } from '@angular/core/rxjs-interop';
import { ProfessionalService } from '@reuse/code/services/api/professional.service';
import { toDataState } from '@reuse/code/utils/rxjs.utils';
import { FormatMultilingualObjectPipe } from '@reuse/code/pipes/format-multilingual-object.pipe';
import { v4 as uuidv4 } from 'uuid';
import { BaseDialog } from '@reuse/code/dialogs/base.dialog';
import { AlertComponent } from '@reuse/code/components/alert-component/alert.component';
import { ProposalState } from '@reuse/code/states/api/proposal.state';
import { getAssignableProfessionalDisciplines } from '@reuse/code/utils/assignment-disciplines.utils';
import { isProposal } from '@reuse/code/utils/utils';
import { CityResource, HealthcareProResource } from '@reuse/code/openapi';

interface TransferAssignation {
  prescriptionId?: string;
  referralTaskId?: string;
  performerTaskId?: string;
  assignedCareGivers?: string[];
  category: string;
  intent: Intent;
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
    IfStatusSuccessDirective,
    TranslationPipe,
    FormatNihdiPipe,
    AsyncPipe,
    FormatMultilingualObjectPipe,
    AlertComponent,
  ],
  providers: [provideNgxMask()],
})
export class TransferAssignationDialog extends BaseDialog implements OnInit {
  protected readonly AlertType = AlertType;
  private readonly nameValidators = [Validators.minLength(2), CaregiverNamePatternValidator];
  private readonly searchCriteria$ = signal<{ query: string; zipCodes: number[] }>({ query: '', zipCodes: [] });

  readonly professionalsState$: Observable<DataState<HealthcareProResource[]>> = toObservable(
    this.searchCriteria$
  ).pipe(
    switchMap(criteria => {
      let disciplines: string[] = getAssignableProfessionalDisciplines(this.data.category, this.data.intent);
      if (criteria.query.length === 0 && criteria.zipCodes.length === 0) {
        return of([]);
      }
      return this.professionalService.findAll(criteria.query, criteria.zipCodes.map(String), disciplines);
    }),
    map(professionals =>
      professionals?.filter(p => {
        if (!p.id?.ssin) {
          return false;
        }
        return !this.data.assignedCareGivers?.includes(p.id.ssin);
      })
    ),
    toDataState()
  );
  readonly formGroup = new FormGroup({
    query: new FormControl<string>(''),
    cities: new FormControl<CityResource[]>([]),
    searchCity: new FormControl<string>(''),
  });
  readonly cityOptions$ = this.formGroup.get('searchCity')!.valueChanges.pipe(
    debounceTime(400),
    switchMap((query: string | null) =>
      query && query.length > 1 ? this.geographyService.findAll(query).pipe(catchError(() => of([]))) : of(null)
    )
  );
  readonly caregiverNameMaxLength = 50;
  queryIsNumeric = false;
  loading = false;
  currentLang?: string;
  generatedUUID = '';

  constructor(
    private readonly prescriptionStateService: PrescriptionState,
    private readonly proposalStateService: ProposalState,
    private readonly professionalService: ProfessionalService,
    private readonly toastService: ToastService,
    private readonly geographyService: GeographyService,
    dialogRef: MatDialogRef<TransferAssignationDialog>,
    @Inject(MAT_DIALOG_DATA) private readonly data: TransferAssignation,
    private readonly translate: TranslateService
  ) {
    super(dialogRef);
    this.currentLang = this.translate.currentLang;
    this.setValidators();
  }

  ngOnInit() {
    this.generatedUUID = uuidv4();
  }

  private setValidators(): void {
    this.formGroup
      .get('query')!
      .setValidators([
        (control: AbstractControl) =>
          this.formGroup.get('cities')!.value!.length === 0 ? Validators.required(control) : null,
      ]);
    this.formGroup.get('query')!.addValidators(this.nameValidators);

    this.formGroup
      .get('cities')!
      .setValidators((control: AbstractControl) =>
        Validators.required(this.formGroup.get('query')!) != null
          ? Validators.required(control) || Validators.minLength(1)(control)
          : null
      );
  }

  search(): void {
    this.formGroup.markAllAsTouched();
    if (this.formGroup.valid) {
      const values = this.formGroup.value;
      const zipCodes = values.cities?.map(c => c.zipCode).filter((zip): zip is number => zip !== undefined) || [];
      this.searchCriteria$.set({
        query: values.query!,
        zipCodes,
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

  onTransfer(professional: HealthcareProResource): void {
    if (!this.data?.prescriptionId) {
      this.closeDialog(professional);
    } else {
      const ssinObject = {
        ssin: professional.id?.ssin || '',
        discipline: professional.id?.profession || '',
      };
      if (isProposal(this.data?.intent)) {
        this.executeTransferAssignment(
          professional,
          () =>
            this.proposalStateService.transferAssignation(
              this.data.prescriptionId!,
              this.data.referralTaskId!,
              this.data.performerTaskId!,
              ssinObject,
              this.generatedUUID
            ),
          'proposal'
        );
      } else {
        this.executeTransferAssignment(
          professional,
          () =>
            this.prescriptionStateService.transferAssignation(
              this.data.prescriptionId!,
              this.data.referralTaskId!,
              this.data.performerTaskId!,
              ssinObject,
              this.generatedUUID
            ),
          'prescription'
        );
      }
    }
  }

  private executeTransferAssignment(
    professional: HealthcareProResource,
    serviceCall: () => Observable<void>,
    successPrefix: string
  ) {
    this.loading = true;
    serviceCall().subscribe({
      next: () => {
        this.closeErrorCard();
        this.toastService.show(successPrefix + '.transferAssignation.success', {
          interpolation: professional.healthcarePerson,
        });
        this.closeDialog(professional);
      },
      error: err => {
        this.loading = false;
        this.showErrorCard('common.somethingWentWrong', err);
      },
    });
  }

  removeCity(city: unknown) {
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
    const currentCity = event.option.value as CityResource;
    const value = [...(control.value || [])].filter(v => v.zipCode !== currentCity.zipCode);
    value.push(currentCity);
    control.setValue(value);
    searchInput.value = '';
    this.formGroup.get('query')!.updateValueAndValidity();
  }
}
