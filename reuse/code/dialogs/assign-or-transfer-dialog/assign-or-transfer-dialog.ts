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
import { AlertType, Intent } from '@reuse/code/interfaces';
import { ToastService } from '@reuse/code/services/helpers/toast.service';
import { PrescriptionState } from '@reuse/code/states/api/prescription.state';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { toDataState } from '@reuse/code/utils/rxjs.utils';
import { HealthcareProviderService } from '@reuse/code/services/api/healthcareProvider.service';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { v4 as uuidv4 } from 'uuid';
import { AlertComponent } from '@reuse/code/components/alert-component/alert.component';
import { BaseDialog } from '@reuse/code/dialogs/base.dialog';
import { HealthcareProResource, ProviderType } from '@reuse/code/openapi';
import { ProposalState } from '@reuse/code/states/api/proposal.state';
import { getAssignableProfessionalDisciplines, isProfessional } from '@reuse/code/utils/assignment-disciplines.utils';
import { getTranslationKeyPrefixForPrescriptionOrProposal, isProposal } from '@reuse/code/utils/utils';
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

export type AssignOrTransferDialogMode = 'assign' | 'transfer';

export interface AssignOrTransferDialogData {
  mode: AssignOrTransferDialogMode;
  prescriptionId?: string;
  referralTaskId?: string;
  performerTaskId?: string; // only used for transfer
  assignedCareGivers?: string[];
  assignedOrganizations?: string[];
  category: string;
  intent: Intent;
}

@Component({
  selector: 'assign-or-transfer-dialog',
  standalone: true,
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
  templateUrl: './assign-or-transfer-dialog.html',
  styleUrl: './assign-or-transfer-dialog.scss',
})
export class AssignOrTransferDialog extends BaseDialog implements OnInit {
  private readonly deviceService = inject(DeviceService);
  private readonly _prescriptionStateService = inject(PrescriptionState);
  private readonly _proposalStateService = inject(ProposalState);
  private readonly _healthcareProviderService = inject(HealthcareProviderService);
  private readonly _toastService = inject(ToastService);
  private readonly _translate = inject(TranslateService);

  protected readonly isDesktop = this.deviceService.isDesktop;

  protected translationKeyPrefixIntent = 'prescription';

  protected readonly AlertType = AlertType;
  readonly searchCriteria$ = signal<SearchCriteria | null>(null);
  readonly isLoading = signal(false);
  readonly selectedProfessional = signal<HealthcareProResource | undefined>(undefined);

  private readonly pageable = this.isDesktop()
    ? {
        page: 1,
        pageSize: 20,
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
          ? this._healthcareProviderService
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

  loading = false;
  generatedUUID = '';
  currentLang?: TranslationType;

  constructor(
    dialogRef: MatDialogRef<AssignOrTransferDialog>,
    @Inject(MAT_DIALOG_DATA) protected data: AssignOrTransferDialogData
  ) {
    super(dialogRef);
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
  }

  ngOnInit() {
    this.generatedUUID = uuidv4();
    this.translationKeyPrefixIntent = getTranslationKeyPrefixForPrescriptionOrProposal(this.data?.intent);
  }

  selectProfessional(healthcareProvider?: HealthcareProResource) {
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

  executeAction(professional: HealthcareProResource): void {
    if (this.data.mode === 'assign') {
      this.executeAssign(professional);
    } else {
      this.executeTransfer(professional);
    }
  }

  private executeService(serviceCall: () => Observable<any>, successKey: string, professional: any) {
    this.loading = true;
    serviceCall().subscribe({
      next: () => {
        this.closeErrorCard();
        this._toastService.show(successKey, { interpolation: professional.healthcarePerson });
        this.closeDialog(professional);
      },
      error: err => {
        this.loading = false;
        this.showErrorCard('common.somethingWentWrong', err);
      },
    });
  }

  private executeAssign(professional: HealthcareProResource) {
    if (!this.data.prescriptionId || !isProfessional(professional)) {
      return this.closeDialog(professional);
    }
    const serviceCall = isProposal(this.data?.intent)
      ? () =>
          this._proposalStateService.assignProposalPerformer(
            this.data.prescriptionId!,
            this.data.referralTaskId!,
            professional,
            this.generatedUUID
          )
      : () =>
          this._prescriptionStateService.assignPrescriptionPerformer(
            this.data.prescriptionId!,
            this.data.referralTaskId!,
            professional,
            this.generatedUUID
          );

    this.executeService(serviceCall, `${this.translationKeyPrefixIntent}.assignPerformer.success`, professional);
  }

  private executeTransfer(professional: HealthcareProResource) {
    if (!this.data.prescriptionId || !isProfessional(professional)) {
      return this.closeDialog(professional);
    }
    const ssinObject = { ssin: professional.id?.ssin || '', discipline: professional.id?.profession || '' };
    const serviceCall = isProposal(this.data?.intent)
      ? () =>
          this._proposalStateService.transferAssignation(
            this.data.prescriptionId!,
            this.data.referralTaskId!,
            this.data.performerTaskId!,
            ssinObject,
            this.generatedUUID
          )
      : () =>
          this._prescriptionStateService.transferAssignation(
            this.data.prescriptionId!,
            this.data.referralTaskId!,
            this.data.performerTaskId!,
            ssinObject,
            this.generatedUUID
          );

    this.executeService(serviceCall, `${this.translationKeyPrefixIntent}.transferPerformer.success`, professional);
  }
}
