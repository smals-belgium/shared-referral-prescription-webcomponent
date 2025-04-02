import { Component, Inject, OnInit, signal } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { debounceTime, of, switchMap } from 'rxjs';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { catchError, map } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { IfStatusLoadingDirective } from '../../directives/if-status-loading.directive';
import { IfStatusSuccessDirective } from '../../directives/if-status-success.directive';
import { AsyncPipe, NgFor, NgIf,  KeyValuePipe, NgClass } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
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
import { Street } from '../../interfaces/healthcareProvider.interface';
import { SsinOrOrganizationIdPipe } from "../../pipes/ssin-or-cbe.pipe";
import { ShowDetailsPipe } from "../../pipes/show-details.pipe";
import { FormatSsinPipe } from "../../pipes/format-ssin.pipe";
import { ActivePageComponent } from "../../components/active-page/active-page.component";
import { MatSelect } from "@angular/material/select";
import { PaginatorComponent } from "../../components/paginator/paginator.component";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { FormatMultilingualObjectPipe } from "../../pipes/format-multilingual-object.pipe";
import { OrganizationService } from "../../services/organization.service";
import { v4 as uuidv4 } from 'uuid';
import { ErrorCardComponent } from '../../components/error-card/error-card.component';
import { BaseDialog } from '../base.dialog';

type ProfessionalType = "CAREGIVER" | "ORGANIZATION" | "ALL";

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
        IfStatusSuccessDirective,
        TranslationPipe,
        NgIf,
        NgFor,
        TranslationPipe,
        FormatNihdiPipe,
        AsyncPipe,
        ActivePageComponent,
        MatSelect,
        SsinOrOrganizationIdPipe,
        ShowDetailsPipe,
        FormatSsinPipe,
        NgClass,
        PaginatorComponent,
        KeyValuePipe,
        MatButtonToggleModule,
        FormatMultilingualObjectPipe,
        ErrorCardComponent
    ],
    providers: [
        provideNgxMask()
    ]
})
export class AssignPrescriptionDialog extends BaseDialog implements OnInit {

  private readonly nameValidators = [Validators.minLength(2), CaregiverNamePatternValidator];
  readonly searchCriteria$ = signal<{ query: string, zipCodes: string[],  professionalType: ProfessionalType, page?: number, pageSize?: number } | null>(null);
  readonly isLoading = signal(false);

  filterProfessionalType: ProfessionalType[] = ["CAREGIVER", "ORGANIZATION"]
  selectedFilter: ProfessionalType = "CAREGIVER"

  readonly healthcareProvidersState$ = toSignal(
    toObservable(this.searchCriteria$).pipe(
      switchMap((criteria) => {
        this.isLoading.set(true)
        return criteria ? this.healthcareProviderService.findAll(
            criteria.query,
            criteria.zipCodes,
            criteria.professionalType !== "ORGANIZATION" ? ['NURSE'] : [],
            criteria.professionalType !== "CAREGIVER" ? ['THIRD_PARTY_PAYING_GROUP', 'GUARD_POST', 'MEDICAL_HOUSE', 'HOME_SERVICES'] : [],
            criteria.page,
            criteria.pageSize
          ).pipe(
            catchError((error) => {
              console.error('Error fetching healthcare providers:', error);
              return of([]);
            })
          ) : of([]);
      }),
      map((healthcareProvider) =>  {
        if(healthcareProvider && 'healthcareProfessionals' in healthcareProvider && 'healthcareOrganizations' in healthcareProvider) {
          const allItems: (Professional | Organization)[] = [...healthcareProvider.healthcareProfessionals, ...healthcareProvider.healthcareOrganizations];
          const items =  allItems.map(hp => {
            if(this.isProfessional(hp)) {
              if(!hp.phoneNumbers) return hp

              const mobileNumber = hp.phoneNumbers.mobileNumber
              if(!mobileNumber || mobileNumber.length === 0) {
                delete hp.phoneNumbers['mobileNumber'];
              }

              const telephoneNumbers = hp.phoneNumbers.telephoneNumbers
              if(telephoneNumbers) {
                hp.phoneNumbers.telephoneNumbers = Object.fromEntries(Object.entries(telephoneNumbers).filter(([_, phoneNumber]) => phoneNumber && phoneNumber.length > 0))
                if(Object.keys(hp.phoneNumbers.telephoneNumbers).length === 0) {
                  delete hp.phoneNumbers['telephoneNumbers'];
                }
              }
              if(!telephoneNumbers) {
                delete hp.phoneNumbers['telephoneNumbers'];
              }
            }
            return hp
          }).filter((hp) => {
            if (this.isProfessional(hp)) {
              return !this.data.assignedCareGivers?.includes((hp).id.ssin)
            } else {
              const nihdi = (hp.nihii8 ?? hp.nihii11) + hp.qualificationCode;
              return !this.data.assignedOrganizations?.includes(nihdi)
            }
          })
          this.isLoading.set(false)
          return {
            items: items,
            total: healthcareProvider.total || items.length,
            page: this.searchCriteria$()?.page ?? 1,
            pageSize: this.searchCriteria$()?.pageSize ?? 10
          }
        } else {
          const list = {
            items: [],
            total: 0,
            page: this.searchCriteria$()?.page ?? 1,
            pageSize: this.searchCriteria$()?.pageSize ?? 10
          }
          this.isLoading.set(false);
          return list;
        }
      }),
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
  visibleDetailsOfHealthcareProvider: string[] = []
  currentLang?: string;

  constructor(
    private prescriptionStateService: PrescriptionState,
    private healthcareProviderService: HealthcareProviderService,
    private toastService: ToastService,
    private geographyService: GeographyService,
    dialogRef: MatDialogRef<AssignPrescriptionDialog>,
    @Inject(MAT_DIALOG_DATA) private data: AssignPrescriptionDialogData,
    private translate: TranslateService,
    private organizationService: OrganizationService
  ) {
    super(dialogRef);
    this.currentLang = this.translate.currentLang
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
        zipCodes,
        page: 1,
        pageSize: this.healthcareProvidersState$()?.data?.pageSize || 10,
        professionalType: this.selectedFilter
      });
    }
  }

  loadData(page?: number, pageSize?: number){
    const values = this.formGroup.value;
    const zipCodes = values.cities?.map(c => c.zipCode) || [];
    this.searchCriteria$.set({
      query: values.query!,
      zipCodes,
      page,
      pageSize,
      professionalType: this.selectedFilter
    });
  }

  filterValues(professionalType: ProfessionalType) {
    this.selectedFilter = professionalType;
    const values = this.formGroup.value;
    const zipCodes = values.cities?.map(c => c.zipCode) || [];
    const page = this.healthcareProvidersState$()?.data?.page || 1;
    const pageSize = this.healthcareProvidersState$()?.data?.pageSize || 10;
    this.searchCriteria$.set({
      query: values.query!,
      zipCodes,
      page,
      pageSize,
      professionalType: professionalType
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

  assign(healthcareProvider: Professional | Organization): void {
    if (!this.data?.prescriptionId) {
      this.closeDialog(healthcareProvider);
    } else {
      this.updatePrescription(healthcareProvider);
    }
  }

  private updatePrescription(healthcareProvider: Professional | Organization): void {
    this.loading = true;

    this.prescriptionStateService.assignPrescriptionPerformer(this.data.prescriptionId!, this.data.referralTaskId!, healthcareProvider, this.generatedUUID)
      .subscribe({
        next: () => {
          const interpolation = 'healthcarePerson' in healthcareProvider ? healthcareProvider.healthcarePerson : healthcareProvider.organizationName;

          this.closeErrorCard();
          if(healthcareProvider.type === 'Professional') {
            this.toastService.show('prescription.assignPerformer.success', {interpolation});
          }
          else{
            this.toastService.show('prescription.assignPerformer.successOrganization', {interpolation});
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

  showDetailsOfHealthcareProvider(event: Event, healthcareProvider: Professional | Organization){
    event.stopPropagation();

    const ssinOrOrganizationIdPipe = new SsinOrOrganizationIdPipe();
    let ssinOrOrganization = ssinOrOrganizationIdPipe.transform(healthcareProvider);

    if(!ssinOrOrganization) return;

    if(this.visibleDetailsOfHealthcareProvider.includes(ssinOrOrganization)) {
      const index = this.visibleDetailsOfHealthcareProvider.findIndex(e => e === ssinOrOrganization);
      if(index < 0) return;
      const visibleDetailsArr = [...this.visibleDetailsOfHealthcareProvider];
      visibleDetailsArr.splice(index, 1);
      this.visibleDetailsOfHealthcareProvider = visibleDetailsArr;
    } else {
      const visibleDetailsArr = [...this.visibleDetailsOfHealthcareProvider];
      visibleDetailsArr.push(ssinOrOrganization);
      this.visibleDetailsOfHealthcareProvider = visibleDetailsArr;
    }
  }

  hasStreet(street: Street): boolean {
    const { streetFr, streetNl, streetDe } = street;
    return streetFr.length > 0 || streetNl.length > 0 || streetDe.length > 0;
  }

  hasName(healthcareProvider: Organization | Professional): boolean {
    if(this.isProfessional(healthcareProvider)) {
      return !!(healthcareProvider.healthcareQualification.descriptionFr || healthcareProvider.healthcareQualification.descriptionNl || healthcareProvider.healthcareQualification.descriptionDe);
    }
    return false;
  }

  hasPhoneNumbers(healthcareProvider: Organization | Professional) {
    if(this.isProfessional(healthcareProvider)){
      return healthcareProvider.phoneNumbers && Object.keys(healthcareProvider.phoneNumbers).length > 0;
    }
    return false;
  }

  getColSpan(healthcareProvider: Organization | Professional) {
    if(this.isProfessional(healthcareProvider)){
      if(!healthcareProvider.phoneNumbers || Object.keys(healthcareProvider.phoneNumbers).length <= 0) {
        return 5;
      } else if(!healthcareProvider.phoneNumbers?.telephoneNumbers || !healthcareProvider.phoneNumbers?.mobileNumber) {
        return 3;
      } else {
        return 1;
      }
    } else {
      return 5;
    }
  }

  isProfessional(object: any): object is Professional {
    return object.type === 'Professional';
  }

  getGroupName(code: string): string {
    return this.organizationService.getGroupNameByCode(code) ?? '';
  }
}
