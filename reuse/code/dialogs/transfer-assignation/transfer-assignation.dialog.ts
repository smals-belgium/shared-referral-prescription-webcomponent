import { Component, inject, Inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Observable, of, switchMap } from 'rxjs';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { catchError, map } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AsyncPipe } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormatNihdiPipe } from '@reuse/code/pipes/format-nihdi.pipe';
import { TranslationPipe } from '@reuse/code/pipes/translation.pipe';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatInputModule } from '@angular/material/input';
import { OverlaySpinnerComponent } from '@reuse/code/components/progress-indicators/overlay-spinner/overlay-spinner.component';
import { AlertType, Intent } from '@reuse/code/interfaces';
import { ToastService } from '@reuse/code/services/helpers/toast.service';
import { PrescriptionState } from '@reuse/code/states/api/prescription.state';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { toDataState } from '@reuse/code/utils/rxjs.utils';
import { FormatMultilingualObjectPipe } from '@reuse/code/pipes/format-multilingual-object.pipe';
import { v4 as uuidv4 } from 'uuid';
import { BaseDialog } from '@reuse/code/dialogs/base.dialog';
import { AlertComponent } from '@reuse/code/components/alert-component/alert.component';
import { ProposalState } from '@reuse/code/states/api/proposal.state';
import { getAssignableProfessionalDisciplines, isProfessional } from '@reuse/code/utils/assignment-disciplines.utils';
import { isProposal } from '@reuse/code/utils/utils';
import { HealthcareOrganizationResource, HealthcareProResource, ProviderType } from '@reuse/code/openapi';
import { PaginatorComponent } from '@reuse/code/components/paginator/paginator.component';
import { HealthcareProviderService } from '@reuse/code/services/api/healthcareProvider.service';
import { ProfessionalCardsComponent } from '@reuse/code/components/professional-form/professional-cards/professional-cards.component';
import {
  ProfessionalSearchFormComponent,
  ProfessionalType,
  SearchCriteria,
} from '@reuse/code/components/professional-form/search-form/professional-search-form.component';
import {
  ProfessionalTableComponent,
  TranslationType,
} from '@reuse/code/components/professional-form/table/professional-table.component';
import { ResponsiveWrapperComponent } from '@reuse/code/components/responsive-wrapper/responsive-wrapper.component';
import { DeviceService } from '@reuse/code/services/helpers/device.service';

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
    MatDialogModule,
    MatButtonModule,
    MatChipsModule,
    TranslateModule,
    MatAutocompleteModule,
    MatIconModule,
    OverlaySpinnerComponent,
    TranslationPipe,
    FormatNihdiPipe,
    AsyncPipe,
    FormatMultilingualObjectPipe,
    AlertComponent,
    PaginatorComponent,
    ProfessionalCardsComponent,
    ProfessionalSearchFormComponent,
    ProfessionalTableComponent,
    ResponsiveWrapperComponent,
  ],
})
export class TransferAssignationDialog extends BaseDialog implements OnInit {
  private readonly deviceService = inject(DeviceService);
  protected readonly isDesktop = this.deviceService.isDesktop;

  protected readonly AlertType = AlertType;
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
                this.data.intent,
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
        if (healthcareProvider && 'healthcareProfessionals' in healthcareProvider) {
          const allItems: HealthcareProResource[] = healthcareProvider.healthcareProfessionals ?? [];

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
    dialogRef: MatDialogRef<TransferAssignationDialog>,
    @Inject(MAT_DIALOG_DATA) protected readonly data: TransferAssignation,
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

  onTransferSelectedValue() {
    const professional = this.selectedProfessional();

    if (professional) {
      this.onTransfer(professional);
    } else {
      this.toastService.show('prescription.transferProfessional.undefined');
    }
  }

  onTransfer(professional: HealthcareProResource | HealthcareOrganizationResource): void {
    if (!this.data?.prescriptionId || !isProfessional(professional)) {
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
    serviceCall: () => Observable<any>,
    successPrefix: string
  ): void {
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
}
