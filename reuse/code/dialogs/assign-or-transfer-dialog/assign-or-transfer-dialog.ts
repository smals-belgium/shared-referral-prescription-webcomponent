import {
  Component,
  computed,
  inject,
  Inject,
  linkedSignal,
  OnDestroy,
  OnInit,
  signal,
  WritableSignal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AlertComponent } from '@reuse/code/components/alert-component/alert.component';
import { ProfessionalSearchChipListComponent } from '@reuse/code/components/professional-form/city-chip-list/professional-search-chip-list.component';
import { ProfessionalCardsComponent } from '@reuse/code/components/professional-form/professional-cards/professional-cards.component';
import {
  ProfessionalSearchFormComponent,
  SearchCriteria,
} from '@reuse/code/components/professional-form/search-form/professional-search-form.component';
import {
  ProfessionalTableComponent,
  TranslationType,
} from '@reuse/code/components/professional-form/table/professional-table.component';
import { OverlaySpinnerComponent } from '@reuse/code/components/progress-indicators/overlay-spinner/overlay-spinner.component';
import { ResponsiveWrapperComponent } from '@reuse/code/components/responsive-wrapper/responsive-wrapper.component';
import { AlertType, Intent, UserInfo } from '@reuse/code/interfaces';
import { CityResource, HealthCareProviderResource, ProviderType } from '@reuse/code/openapi';
import { HealthcareProviderService } from '@reuse/code/services/api/healthcareProvider.service';
import { AlertService } from '@reuse/code/services/helpers/alert.service';
import { DeviceService } from '@reuse/code/services/helpers/device.service';
import { ToastService } from '@reuse/code/services/helpers/toast.service';
import { PrescriptionState } from '@reuse/code/states/api/prescription.state';
import { ProposalState } from '@reuse/code/states/api/proposal.state';
import { getAssignableProfessionalDisciplines, isProfessional } from '@reuse/code/utils/assignment-disciplines.utils';
import { toDataState } from '@reuse/code/utils/rxjs.utils';
import { getTranslationKeyPrefixForPrescriptionOrProposal, isProposal } from '@reuse/code/utils/utils';
import { combineLatest, Observable, of, switchMap } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

export type AssignOrTransferDialogMode = 'assign' | 'transfer';

export interface AssignOrTransferDialogData {
  mode: AssignOrTransferDialogMode;
  prescriptionId?: string;
  referralTaskId?: string;
  performerTaskId?: string; // only used for transfer
  category: string;
  intent: Intent;
  connectedUser: Partial<UserInfo>;
}

@Component({
  selector: 'assign-or-transfer-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDialogModule,
    MatButtonModule,
    MatChipsModule,
    TranslateModule,
    MatAutocompleteModule,
    MatIconModule,
    OverlaySpinnerComponent,
    MatButtonToggleModule,
    ProfessionalSearchFormComponent,
    ProfessionalTableComponent,
    AlertComponent,
    ResponsiveWrapperComponent,
    ProfessionalCardsComponent,
    ProfessionalSearchChipListComponent,
  ],
  templateUrl: './assign-or-transfer-dialog.html',
  styleUrl: './assign-or-transfer-dialog.scss',
})
export class AssignOrTransferDialog implements OnInit, OnDestroy {
  private readonly deviceService = inject(DeviceService);
  private readonly _prescriptionStateService = inject(PrescriptionState);
  private readonly _proposalStateService = inject(ProposalState);
  private readonly _healthcareProviderService = inject(HealthcareProviderService);
  private readonly _toastService = inject(ToastService);
  private readonly _translate = inject(TranslateService);
  private readonly alertService = inject(AlertService);

  private readonly ERROR_ASSIGN_TRANSFER_DIALOG = 'assign-transfer-dialog';
  protected readonly error = this.alertService.setTarget(this.ERROR_ASSIGN_TRANSFER_DIALOG);

  protected readonly providerTypeOptions: ProviderType[] = [
    ProviderType.All,
    ProviderType.Professional,
    ProviderType.Organization,
  ];

  protected readonly isDesktop = this.deviceService.isDesktop;

  protected translationKeyPrefixIntent: 'prescription' | 'proposal' = 'prescription';

  protected readonly AlertType = AlertType;
  readonly searchCriteria$ = signal<SearchCriteria | null>(null);
  readonly zipCodes = computed(() =>
    this.searchCriteria$()
      ?.cities.map(c => c.zipCode)
      .filter((z): z is number => z !== undefined)
  );
  readonly isLoading = signal(false);
  readonly selectedProfessional = signal<HealthCareProviderResource | undefined>(undefined);

  protected providerType = signal<ProviderType>(ProviderType.All);

  protected readonly isSearchMode: WritableSignal<boolean> = signal(true);

  readonly queryControl = new FormControl('', { nonNullable: true });
  readonly cityControl = new FormControl<CityResource[]>([], { nonNullable: true });

  readonly formGroup = new FormGroup({
    query: this.queryControl,
    cities: this.cityControl,
  });

  protected readonly pageable = linkedSignal<ProviderType, { page: number; pageSize: number }>({
    source: () => this.providerType(),
    computation: (source, previous) => ({
      page: 1,
      pageSize: previous?.value.pageSize ?? 10,
    }),
  });

  readonly healthcareProvidersState$ = toSignal(
    combineLatest([
      toObservable(this.searchCriteria$),
      toObservable(this.pageable),
      toObservable(this.providerType),
    ]).pipe(
      switchMap(([criteria, pagination, providerType]) => {
        this.isLoading.set(true);
        const disciplines: string[] = getAssignableProfessionalDisciplines(this.data.category, this.data.intent);
        const zipCodes = criteria?.cities.map(c => c.zipCode).filter((z): z is number => z !== undefined) ?? [];

        return criteria
          ? this._healthcareProviderService
              .findAll(
                criteria.query,
                zipCodes,
                disciplines,
                [],
                providerType,
                this.data.prescriptionId,
                this.data.intent,
                this.currentLang,
                pagination.page,
                pagination.pageSize
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
        if (healthcareProvider && 'healthcarePro' in healthcareProvider) {
          const allItems: HealthCareProviderResource[] = healthcareProvider.healthcarePro ?? [];

          this.isLoading.set(false);
          return {
            items: allItems,
            total: healthcareProvider.total || allItems.length,
          };
        } else {
          const list = {
            items: [],
            total: 0,
          };
          this.isLoading.set(false);
          return list;
        }
      }),
      toDataState()
    )
  );

  loading = false;
  generatedUUID = '';
  currentLang?: TranslationType;

  constructor(
    protected dialogRef: MatDialogRef<AssignOrTransferDialog>,
    @Inject(MAT_DIALOG_DATA) protected data: AssignOrTransferDialogData
  ) {
    this.currentLang = this._translate.currentLang as TranslationType;
  }

  get mode() {
    return this.data.mode;
  }

  get modeKey() {
    return this.data.mode === 'assign' ? 'assignPerformer' : 'transferPerformer';
  }
  onSearch(criteria: SearchCriteria): void {
    this.searchCriteria$.set(criteria);
    this.isSearchMode.set(false);
  }

  ngOnInit() {
    this.generatedUUID = uuidv4();
    this.alertService.setActive(this.ERROR_ASSIGN_TRANSFER_DIALOG);
    this.translationKeyPrefixIntent = getTranslationKeyPrefixForPrescriptionOrProposal(this.data?.intent);
  }

  selectProfessional(healthcareProvider?: HealthCareProviderResource) {
    this.selectedProfessional.set(healthcareProvider);
  }

  onSubmitSelectedValue(): void {
    const professional = this.selectedProfessional();
    if (!professional) {
      this._toastService.show(`prescription.${this.mode}Professional.undefined`);
      return;
    }
    this.executeAction(professional);
  }

  executeAction(professional: HealthCareProviderResource): void {
    if (this.data.mode === 'assign') {
      this.executeAssign(professional);
    } else {
      this.executeTransfer(professional);
    }
  }

  private executeService(
    serviceCall: () => Observable<any>,
    successKey: string,
    professional: HealthCareProviderResource
  ) {
    this.loading = true;
    serviceCall()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          const interpolation = isProfessional(professional)
            ? professional.healthcarePerson
            : {
                firstName: professional.organizationName![this.currentLang ?? 'nl'],
                lastName: '',
              };

          this._toastService.show(successKey, { interpolation });
          this.dialogRef.close(professional);
        },
      });
  }

  private extractPerformerIdentifiers(professional: HealthCareProviderResource) {
    if (isProfessional(professional)) {
      return {
        ssinOrNihdi: professional.healthcarePerson?.ssin,
        role: professional.healthcareQualification?.id?.profession,
        type: professional.type,
      };
    } else {
      const ho = professional;
      return {
        ssinOrNihdi: (ho.nihii8 || ho.nihii11) + (ho.qualificationCode ?? ''),
        type: ho.typeCode,
      };
    }
  }

  private executeAssign(professional: HealthCareProviderResource) {
    if (!this.data.prescriptionId) {
      return this.dialogRef.close(professional);
    }

    const { ssinOrNihdi, role, type } = this.extractPerformerIdentifiers(professional);

    const serviceCall = isProposal(this.data?.intent)
      ? () =>
          this._proposalStateService.assignProposalPerformer(
            this.data.prescriptionId!,
            this.data.referralTaskId!,
            ssinOrNihdi || '',
            role || '',
            type || '',
            this.generatedUUID
          )
      : () =>
          this._prescriptionStateService.assignPrescriptionPerformer(
            this.data.prescriptionId!,
            this.data.referralTaskId!,
            ssinOrNihdi || '',
            role || '',
            type || '',
            this.generatedUUID
          );

    this.executeService(serviceCall, `${this.translationKeyPrefixIntent}.assignPerformer.success`, professional);
  }

  private executeTransfer(professional: HealthCareProviderResource) {
    if (!this.data.prescriptionId) {
      return this.dialogRef.close(professional);
    }

    const { ssinOrNihdi, role, type } = this.extractPerformerIdentifiers(professional);

    const serviceCall = isProposal(this.data?.intent)
      ? () =>
          this._proposalStateService.transferAssignation(
            this.data.prescriptionId!,
            this.data.referralTaskId!,
            this.data.performerTaskId!,
            ssinOrNihdi || '',
            role || '',
            type || '',
            this.generatedUUID
          )
      : () =>
          this._prescriptionStateService.transferAssignation(
            this.data.prescriptionId!,
            this.data.referralTaskId!,
            this.data.performerTaskId!,
            ssinOrNihdi || '',
            role || '',
            type || '',
            this.generatedUUID
          );

    this.executeService(serviceCall, `${this.translationKeyPrefixIntent}.transferPerformer.success`, professional);
  }

  loadData(pageValues?: { pageIndex?: number; pageSize?: number }) {
    const { pageIndex, pageSize } = pageValues ?? {};

    if (pageIndex && pageSize) {
      this.pageable.set({ page: pageIndex, pageSize: pageSize });
    } else {
      this.alertService.showGeneralError(this.ERROR_ASSIGN_TRANSFER_DIALOG);
    }
  }

  triggerRemoveCriteria() {
    const cities = this.cityControl.value ?? [];
    const query = this.queryControl.value;

    if (cities.length === 0 && query.length === 0) {
      this.queryControl.setValue('');
      this.queryControl.markAsUntouched();
      this.isSearchMode.set(true);
    } else {
      const filteredCities = cities.filter((c): c is typeof c & { zipCode: number } => c.zipCode !== undefined);
      const searchCriteria: SearchCriteria = { cities: filteredCities, query: this.queryControl.value };
      this.onSearch(searchCriteria);
    }
  }

  goBackToSearch() {
    // Resets pagination to display first page when next search is done
    this.pageable.set({ page: 1, pageSize: this.pageable().pageSize });

    this.queryControl.setValue('');
    this.queryControl.markAsUntouched();
    this.isSearchMode.set(true);
    this.clearAlertService();
  }

  protected retry() {
    this.clearAlertService();
    this.dialogRef.close();
  }

  protected dismissError() {
    this.alertService.clear(this.ERROR_ASSIGN_TRANSFER_DIALOG);
  }

  readonly infoAlertDescription = computed(() => {
    if (this.modeKey === 'assignPerformer' && this.translationKeyPrefixIntent === 'prescription') {
      if (this.data?.connectedUser?.discipline === 'PATIENT') {
        return this.translationKeyPrefixIntent + '.assignPerformer.dialog.description.patient';
      } else {
        return this.translationKeyPrefixIntent + '.assignPerformer.dialog.description.other';
      }
    } else {
      return this.translationKeyPrefixIntent + '.' + this.modeKey + '.dialog.description';
    }
  });

  ngOnDestroy() {
    this.clearAlertService();
  }

  clearAlertService() {
    this.alertService.resetActive();
    this.alertService.remove(this.ERROR_ASSIGN_TRANSFER_DIALOG);
  }
}
