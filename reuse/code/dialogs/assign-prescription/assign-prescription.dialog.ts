import { Component, Inject, OnInit, signal } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { debounceTime, Observable, of, switchMap } from 'rxjs';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { catchError, map } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AsyncPipe, KeyValuePipe, NgClass } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormatNihdiPipe } from '@reuse/code/pipes/format-nihdi.pipe';
import { TranslationPipe } from '@reuse/code/pipes/translation.pipe';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { MatInputModule } from '@angular/material/input';
import {
  OverlaySpinnerComponent
} from '@reuse/code/components/progress-indicators/overlay-spinner/overlay-spinner.component';
import { CaregiverNamePatternValidator } from '@reuse/code/utils/validators';
import { AlertType, Intent } from '@reuse/code/interfaces';
import { GeographyService } from '@reuse/code/services/api/geography.service';
import { ToastService } from '@reuse/code/services/helpers/toast.service';
import { PrescriptionState } from '@reuse/code/states/api/prescription.state';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { toDataState } from '@reuse/code/utils/rxjs.utils';
import { HealthcareProviderService } from '@reuse/code/services/api/healthcareProvider.service';
import { SsinOrOrganizationIdPipe } from '@reuse/code/pipes/ssin-or-cbe.pipe';
import { ShowDetailsPipe } from '@reuse/code/pipes/show-details.pipe';
import { ActivePageComponent } from '@reuse/code/components/active-page/active-page.component';
import { MatSelect } from '@angular/material/select';
import { PaginatorComponent } from '@reuse/code/components/paginator/paginator.component';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { OrganizationService } from '@reuse/code/services/helpers/organization.service';
import { v4 as uuidv4 } from 'uuid';
import { AlertComponent } from '@reuse/code/components/alert-component/alert.component';
import { BaseDialog } from '@reuse/code/dialogs/base.dialog';
import {
  CityResource,
  HealthcareOrganizationResource,
  HealthcareProResource,
  PerformerTaskIdResource, ProviderType,
  TelephoneNumbers,
  Translation,
} from '@reuse/code/openapi';
import { FormatMultilingualObjectPipe } from '@reuse/code/pipes/format-multilingual-object.pipe';
import { ProposalState } from '@reuse/code/states/api/proposal.state';
import {
  getAssignableOrganizationInstitutionTypes,
  getAssignableProfessionalDisciplines,
  isProfessional,
} from '@reuse/code/utils/assignment-disciplines.utils';
import { isProposal } from '@reuse/code/utils/utils';

type ProfessionalType = 'CAREGIVER' | 'ORGANIZATION' | 'ALL';

interface AssignPrescriptionDialogData {
  prescriptionId?: string;
  referralTaskId?: string;
  assignedCareGivers?: string[];
  assignedOrganizations?: string[];
  category: string;
  intent: Intent;
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
    TranslationPipe,
    TranslationPipe,
    FormatNihdiPipe,
    AsyncPipe,
    ActivePageComponent,
    MatSelect,
    SsinOrOrganizationIdPipe,
    ShowDetailsPipe,
    NgClass,
    PaginatorComponent,
    KeyValuePipe,
    MatButtonToggleModule,
    FormatMultilingualObjectPipe,
    AlertComponent
  ],
  providers: [provideNgxMask()],
})
export class AssignPrescriptionDialog extends BaseDialog implements OnInit {
  protected readonly isProfessional = isProfessional;
  protected readonly AlertType = AlertType;
  private readonly nameValidators = [Validators.minLength(2), CaregiverNamePatternValidator];
  readonly searchCriteria$ = signal<{
    query: string;
    zipCodes: number[];
    professionalType: ProfessionalType;
    page?: number;
    pageSize?: number;
  } | null>(null);
  readonly isLoading = signal(false);

  filterProfessionalType: ProfessionalType[] = ['CAREGIVER', 'ORGANIZATION'];
  selectedFilter: ProfessionalType = 'CAREGIVER';

  readonly healthcareProvidersState$ = toSignal(
    toObservable(this.searchCriteria$).pipe(
      switchMap(criteria => {
        this.isLoading.set(true);
        const institutionTypes: string[] = getAssignableOrganizationInstitutionTypes(
          this.data.category,
          this.data.intent
        );
        const disciplines: string[] = getAssignableProfessionalDisciplines(this.data.category, this.data.intent);
        return criteria
          ? this.healthcareProviderService
            .findAll(
              criteria.query,
              criteria.zipCodes,
              criteria.professionalType !== 'ORGANIZATION' ? disciplines : [],
              criteria.professionalType !== 'CAREGIVER' ? institutionTypes : [],
              ProviderType.All,
              criteria.page,
              criteria.pageSize
            )
            .pipe(
              catchError(error => {
                console.error('Error fetching healthcare providers:', error);
                return of([]);
              })
            )
          : of([]);
      }),
      map(healthcareProvider => {
        if (
          healthcareProvider &&
          'healthcareProfessionals' in healthcareProvider &&
          'healthcareOrganizations' in healthcareProvider
        ) {
          const allItems: (HealthcareProResource | HealthcareOrganizationResource)[] = [
            ...(healthcareProvider.healthcareProfessionals ?? []),
            ...(healthcareProvider.healthcareOrganizations ?? []),
          ];
          const items = allItems
            .map(hp => {
              if (isProfessional(hp)) {
                if (!hp.phoneNumbers) return hp;

                const mobileNumber = hp.phoneNumbers.mobileNumber;
                if (!mobileNumber || mobileNumber.length === 0) {
                  delete hp.phoneNumbers['mobileNumber'];
                }

                const telephoneNumbers = hp.phoneNumbers.telephoneNumbers;
                if (telephoneNumbers) {
                  hp.phoneNumbers.telephoneNumbers = Object.fromEntries(
                    Object.entries(telephoneNumbers).filter((entry: [string, string | undefined]) => {
                      const [, phoneNumber] = entry;
                      return !!phoneNumber && phoneNumber.length > 0;
                    })
                  );
                  if (Object.keys(hp.phoneNumbers.telephoneNumbers).length === 0) {
                    delete hp.phoneNumbers['telephoneNumbers'];
                  }
                }
                if (!telephoneNumbers) {
                  delete hp.phoneNumbers['telephoneNumbers'];
                }
              }
              return hp;
            })
            .filter(hp => {
              if (isProfessional(hp)) {
                if (!hp.id?.ssin) return false;
                return !this.data.assignedCareGivers?.includes(hp.id.ssin);
              } else {
                const nihdi = (hp.nihii8 ?? hp.nihii11 ?? '') + hp.qualificationCode;
                return !this.data.assignedOrganizations?.includes(nihdi);
              }
            });
          this.isLoading.set(false);
          return {
            items: items,
            total: healthcareProvider.total || items.length,
            page: this.searchCriteria$()?.page ?? 1,
            pageSize: this.searchCriteria$()?.pageSize ?? 10,
          };
        } else {
          const list = {
            items: [],
            total: 0,
            page: this.searchCriteria$()?.page ?? 1,
            pageSize: this.searchCriteria$()?.pageSize ?? 10,
          };
          this.isLoading.set(false);
          return list;
        }
      }),
      toDataState()
    )
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
  generatedUUID = '';
  visibleDetailsOfHealthcareProvider: string[] = [];
  currentLang?: string;

  constructor(
    private prescriptionStateService: PrescriptionState,
    private proposalStateService: ProposalState,
    private healthcareProviderService: HealthcareProviderService,
    private toastService: ToastService,
    private geographyService: GeographyService,
    dialogRef: MatDialogRef<AssignPrescriptionDialog>,
    @Inject(MAT_DIALOG_DATA) private data: AssignPrescriptionDialogData,
    private translate: TranslateService,
    private organizationService: OrganizationService
  ) {
    super(dialogRef);
    this.currentLang = this.translate.currentLang;
    this.setValidators();
  }

  telephoneNumbersList(healthcareProvider: HealthcareProResource): { key: string; value: string }[] {
    if (!healthcareProvider) return [];
    const numbers = healthcareProvider.phoneNumbers?.telephoneNumbers || [];

    // Filter out undefined values and return in a format suitable for iteration
    return (Object.entries(numbers || {}) as [keyof TelephoneNumbers, string | undefined][])
      .filter(([, value]) => !!value)
      .map(([key, value]) => ({
        key,
        value: value as string,
      }));
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
      const cities = values.cities as CityResource[];
      const zipCodes = cities?.map(c => c.zipCode).filter((z): z is number => z !== undefined) || [];
      this.searchCriteria$.set({
        query: values.query!,
        zipCodes,
        page: 1,
        pageSize: this.healthcareProvidersState$()?.data?.pageSize || 10,
        professionalType: this.selectedFilter,
      });
    }
  }

  loadData(pageValues?: { pageIndex?: number; pageSize?: number }) {
    const values = this.formGroup.value;
    const cities = values.cities as CityResource[];
    const zipCodes = cities?.map(c => c.zipCode).filter((z): z is number => z !== undefined) || [];

    this.searchCriteria$.set({
      query: values.query!,
      zipCodes,
      page: pageValues?.pageIndex,
      pageSize: pageValues?.pageSize,
      professionalType: this.selectedFilter,
    });
  }

  filterValues(professionalType: ProfessionalType) {
    this.selectedFilter = professionalType;
    const values = this.formGroup.value;
    const cities = values.cities as CityResource[];
    const zipCodes = cities?.map(c => c.zipCode).filter((z): z is number => z !== undefined) || [];

    const page = this.healthcareProvidersState$()?.data?.page || 1;
    const pageSize = this.healthcareProvidersState$()?.data?.pageSize || 10;
    this.searchCriteria$.set({
      query: values.query!,
      zipCodes,
      page,
      pageSize,
      professionalType: professionalType,
    });
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

  onAssign(healthcareProvider: HealthcareProResource | HealthcareOrganizationResource): void {
    if (!this.data?.prescriptionId) {
      this.closeDialog(healthcareProvider);
    } else {
      if (isProposal(this.data?.intent)) {
        this.executeAssignment(
          healthcareProvider,
          () =>
            this.proposalStateService.assignProposalPerformer(
              this.data.prescriptionId!,
              this.data.referralTaskId!,
              healthcareProvider,
              this.generatedUUID
            ),
          'proposal'
        );
      } else {
        this.executeAssignment(
          healthcareProvider,
          () =>
            this.prescriptionStateService.assignPrescriptionPerformer(
              this.data.prescriptionId!,
              this.data.referralTaskId!,
              healthcareProvider,
              this.generatedUUID
            ),
          'prescription'
        );
      }
    }
  }

  private executeAssignment(
    healthcareProvider: HealthcareProResource | HealthcareOrganizationResource,
    serviceCall: () => Observable<PerformerTaskIdResource>,
    successPrefix: string
  ): void {
    this.loading = true;

    serviceCall().subscribe({
      next: () => {
        const name =
          'healthcarePerson' in healthcareProvider
            ? healthcareProvider.healthcarePerson
            : this.getOrganizationNameTranslation(healthcareProvider);

        this.closeErrorCard();
        if (healthcareProvider.type === 'Professional') {
          this.toastService.show(successPrefix + '.assignPerformer.success', {interpolation: name});
        } else {
          this.toastService.show(successPrefix + '.assignPerformer.successOrganization', {interpolation: name});
        }
        this.closeDialog(healthcareProvider);
      },
      error: err => {
        this.loading = false;
        this.showErrorCard('common.somethingWentWrong', err);
      },
    });
  }

  private getOrganizationNameTranslation(healthcareProvider: HealthcareProResource | HealthcareOrganizationResource): {
    name: string;
  } {
    if (isProfessional(healthcareProvider) || !healthcareProvider.organizationName) return {name: ''};
    type Lang = keyof Translation;
    const lang = (this.currentLang && this.currentLang.length >= 2 ? this.currentLang.slice(0, 2) : 'fr') as Lang;
    return {
      name: healthcareProvider.organizationName[lang] ?? '',
    };
  }

  removeCity(city: CityResource) {
    const control = this.formGroup.get('cities')!;
    const updated = control.value?.filter(c => c !== city) || [];
    control.setValue(updated);
    this.formGroup.get('query')!.updateValueAndValidity();
  }

  addCity(event: MatAutocompleteSelectedEvent, searchInput: HTMLInputElement) {
    if (!event.option.value) {
      return;
    }

    const selectedCity = event.option.value as CityResource;

    const control = this.formGroup.get('cities')!;
    const cities = control.value || [];
    const value = cities.filter(v => v.zipCode !== selectedCity.zipCode);
    value.push(selectedCity);
    control.setValue(value);
    searchInput.value = '';
    this.formGroup.get('query')!.updateValueAndValidity();
  }

  showDetailsOfHealthcareProvider(
    event: Event,
    healthcareProvider: HealthcareProResource | HealthcareOrganizationResource
  ): void {
    event.stopPropagation();

    const ssinOrOrganizationIdPipe = new SsinOrOrganizationIdPipe();
    const ssinOrOrganization = ssinOrOrganizationIdPipe.transform(healthcareProvider);

    if (!ssinOrOrganization) return;

    if (this.visibleDetailsOfHealthcareProvider.includes(ssinOrOrganization)) {
      const index = this.visibleDetailsOfHealthcareProvider.findIndex(e => e === ssinOrOrganization);
      if (index < 0) return;
      const visibleDetailsArr = [...this.visibleDetailsOfHealthcareProvider];
      visibleDetailsArr.splice(index, 1);
      this.visibleDetailsOfHealthcareProvider = visibleDetailsArr;
    } else {
      const visibleDetailsArr = [...this.visibleDetailsOfHealthcareProvider];
      visibleDetailsArr.push(ssinOrOrganization);
      this.visibleDetailsOfHealthcareProvider = visibleDetailsArr;
    }
  }

  hasStreet(street?: Translation): boolean {
    if (!street) return false;

    const {fr, nl, de} = street;
    return (fr && fr.length > 0) || (nl && nl.length > 0) || (de && de.length > 0) || false;
  }

  hasName(healthcareProvider: HealthcareProResource | HealthcareOrganizationResource): boolean {
    if (isProfessional(healthcareProvider)) {
      return !!(
        healthcareProvider.healthcareQualification?.description?.fr ||
        healthcareProvider.healthcareQualification?.description?.nl ||
        healthcareProvider.healthcareQualification?.description?.de
      );
    }
    return false;
  }

  hasPhoneNumbers(healthcareProvider: HealthcareProResource | HealthcareOrganizationResource) {
    if (isProfessional(healthcareProvider)) {
      return healthcareProvider.phoneNumbers && Object.keys(healthcareProvider.phoneNumbers).length > 0;
    }
    return false;
  }

  getColSpan(healthcareProvider: HealthcareProResource | HealthcareOrganizationResource) {
    if (isProfessional(healthcareProvider)) {
      if (!healthcareProvider.phoneNumbers || Object.keys(healthcareProvider.phoneNumbers).length <= 0) {
        return 5;
      } else if (!healthcareProvider.phoneNumbers?.telephoneNumbers || !healthcareProvider.phoneNumbers?.mobileNumber) {
        return 3;
      } else {
        return 1;
      }
    } else {
      return 5;
    }
  }

  getGroupName(code?: string): string {
    if (!code) return '';
    return this.organizationService.getGroupNameByCode(code) ?? '';
  }
}
