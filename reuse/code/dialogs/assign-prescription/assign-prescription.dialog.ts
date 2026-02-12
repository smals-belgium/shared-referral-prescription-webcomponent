import { Component, inject, Inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Observable, of, switchMap } from 'rxjs';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { catchError, map } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatInputModule } from '@angular/material/input';
import { OverlaySpinnerComponent } from '@reuse/code/components/progress-indicators/overlay-spinner/overlay-spinner.component';
import { AlertType, Intent, LoadingStatus } from '@reuse/code/interfaces';
import { ToastService } from '@reuse/code/services/helpers/toast.service';
import { PrescriptionState } from '@reuse/code/states/api/prescription.state';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { toDataState } from '@reuse/code/utils/rxjs.utils';
import { HealthcareProviderService } from '@reuse/code/services/api/healthcareProvider.service';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { v4 as uuidv4 } from 'uuid';
import { AlertComponent } from '@reuse/code/components/alert-component/alert.component';
import { BaseDialog } from '@reuse/code/dialogs/base.dialog';
import {
  HealthcareOrganizationResource,
  HealthcareProResource,
  PerformerTaskIdResource,
  ProviderType,
  Translation,
} from '@reuse/code/openapi';
import { ProposalState } from '@reuse/code/states/api/proposal.state';
import { getAssignableProfessionalDisciplines, isProfessional } from '@reuse/code/utils/assignment-disciplines.utils';
import { isProposal } from '@reuse/code/utils/utils';
import {
  ProfessionalSearchFormComponent,
  SearchCriteria,
} from '@reuse/code/components/professional-form/search-form/professional-search-form.component';
import {
  ProfessionalTableComponent,
  TranslationType,
} from '@reuse/code/components/professional-form/table/professional-table.component';
import { ResponsiveWrapperComponent } from '@reuse/code/components/responsive-wrapper/responsive-wrapper.component';
import { ProfessionalCardsComponent } from '@reuse/code/components/professional-form/professional-cards/professional-cards.component';
import { DeviceService } from '@reuse/code/services/helpers/device.service';

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
  ],
})
export class AssignPrescriptionDialog extends BaseDialog implements OnInit {
  private readonly deviceService = inject(DeviceService);
  protected readonly isDesktop = this.deviceService.isDesktop;

  protected readonly isProfessional = isProfessional;
  protected readonly AlertType = AlertType;
  protected readonly LoadingStatus = LoadingStatus;
  readonly searchCriteria$ = signal<SearchCriteria | null>(null);

  readonly isLoading = signal(false);
  readonly selectedProfessional = signal<HealthcareProResource | HealthcareOrganizationResource | undefined>(undefined);

  filterProfessionalType: ProfessionalType[] = ['CAREGIVER', 'ORGANIZATION'];
  selectedFilter: ProfessionalType = 'CAREGIVER';
  private readonly pageable = this.isDesktop()
    ? {
        page: undefined,
        pageSize: undefined,
      }
    : {
        page: 1,
        pageSize: 10,
      };

  readonly healthcareProvidersState$ = toSignal(
    toObservable(this.searchCriteria$).pipe(
      switchMap(criteria => {
        this.isLoading.set(true);
        const disciplines: string[] = getAssignableProfessionalDisciplines(this.data.category, this.data.intent);
        return criteria
          ? this.healthcareProviderService
              .findAll(
                criteria.query,
                criteria.zipCodes,
                disciplines,
                [],
                ProviderType.Professional,
                this.data.prescriptionId,
                this.pageable.page,
                this.pageable.pageSize
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
          ('healthcareProfessionals' in healthcareProvider || 'healthcareOrganizations' in healthcareProvider)
        ) {
          const allItems: (HealthcareProResource | HealthcareOrganizationResource)[] = [
            ...(healthcareProvider.healthcareProfessionals ?? []),
            ...(healthcareProvider.healthcareOrganizations ?? []),
          ];

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

  queryIsNumeric = false;
  loading = false;
  generatedUUID = '';
  visibleDetailsOfHealthcareProvider: string[] = [];
  currentLang?: TranslationType;

  constructor(
    private prescriptionStateService: PrescriptionState,
    private proposalStateService: ProposalState,
    private healthcareProviderService: HealthcareProviderService,
    private toastService: ToastService,

    dialogRef: MatDialogRef<AssignPrescriptionDialog>,
    @Inject(MAT_DIALOG_DATA) protected data: AssignPrescriptionDialogData,
    private translate: TranslateService
  ) {
    super(dialogRef);
    this.currentLang = this.translate.currentLang as TranslationType;
  }

  onSearch(criteria: SearchCriteria): void {
    this.searchCriteria$.set(criteria);
  }

  ngOnInit() {
    this.generatedUUID = uuidv4();
  }

  selectProfessional(healthcareProvider?: HealthcareProResource | HealthcareOrganizationResource) {
    this.selectedProfessional.set(healthcareProvider);
  }

  onAssignSelectedValue() {
    const professional = this.selectedProfessional();

    if (professional) {
      this.onAssign(professional);
    } else {
      this.toastService.show('prescription.assignProfessional.undefined');
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
          this.toastService.show(successPrefix + '.assignPerformer.success', { interpolation: name });
        } else {
          this.toastService.show(successPrefix + '.assignPerformer.successOrganization', { interpolation: name });
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
    if (isProfessional(healthcareProvider) || !healthcareProvider.organizationName) return { name: '' };
    type Lang = keyof Translation;
    const lang = (this.currentLang && this.currentLang.length >= 2 ? this.currentLang.slice(0, 2) : 'fr') as Lang;
    return {
      name: healthcareProvider.organizationName[lang] ?? '',
    };
  }
}
