import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, WritableSignal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { PerformerTaskIdResource, PerformerTaskResource, ReadRequestResource } from '@reuse/code/openapi';
import { AssignPrescriptionDialog } from '@reuse/code/dialogs/assign-prescription/assign-prescription.dialog';
import { UserInfo } from '@reuse/code/interfaces';
import { isPrescription } from '@reuse/code/utils/utils';
import { MatDialog } from '@angular/material/dialog';
import { ToastService } from '@reuse/code/services/helpers/toast.service';
import { Observable } from 'rxjs';
import { PrescriptionState } from '@reuse/code/states/api/prescription.state';
import { ProposalState } from '@reuse/code/states/api/proposal.state';
import { PrescriptionDetailsOrganizationListComponent } from './prescription-details-organization-list/prescription-details-organization-list.component';
import { PrescriptionDetailsCaregiverListComponent } from './prescription-details-caregiver-list/prescription-details-caregiver-list.component';
import { PrescriptionDetailsSecondaryService } from './prescription-details-secondary.service';
import { CanSelfAssignPipe } from '@reuse/code/pipes/can-self-assign.pipe';
import { CanStartTreatmentPipe } from '@reuse/code/pipes/can-start-treatment.pipe';
import { CanAssignCaregiverPipe } from '@reuse/code/pipes/can-assign-caregiver.pipe';

@Component({
  selector: 'app-prescription-details-secondary',
  imports: [
    MatButton,
    MatIcon,
    TranslatePipe,
    PrescriptionDetailsOrganizationListComponent,
    PrescriptionDetailsCaregiverListComponent,
    CanSelfAssignPipe,
    CanStartTreatmentPipe,
    CanAssignCaregiverPipe,
  ],
  templateUrl: './prescription-details-secondary.component.html',
  styleUrl: './prescription-details-secondary.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  standalone: true,
})
export class PrescriptionDetailsSecondaryComponent {
  private readonly _service = inject(PrescriptionDetailsSecondaryService);
  private readonly _dialog = inject(MatDialog);
  private readonly _toastService = inject(ToastService);
  private readonly _prescriptionStateService = inject(PrescriptionState);
  private readonly _proposalStateService = inject(ProposalState);
  protected readonly prescriptionSecondaryService = inject(PrescriptionDetailsSecondaryService);

  readonly prescriptionServiceData: ReadRequestResource | undefined = this._service.getPrescription().data;
  readonly currentUserServiceData: Partial<UserInfo> | undefined = this._service.getCurrentUser().data;
  readonly performerTaskServiceData: PerformerTaskResource | undefined = this._service.getPerformerTask().data;

  readonly loading: WritableSignal<boolean> = this._service.loading;
  readonly generatedUUID = this._service.generatedUUID;

  openAssignDialog(prescription: ReadRequestResource): void {
    this._dialog.open(AssignPrescriptionDialog, {
      data: {
        prescriptionId: prescription.id,
        referralTaskId: prescription.referralTask?.id,
        assignedCareGivers: prescription.performerTasks?.map(c => c.careGiverSsin),
        assignedOrganizations: prescription.organizationTasks?.map(o => o.organizationNihii),
        category: prescription.category,
        intent: prescription.intent,
      },
      panelClass: 'mh-dialog-container',
    });
  }

  onSelfAssign(prescription: ReadRequestResource, currentUser?: Partial<UserInfo>): void {
    if (!prescription.id || !prescription.referralTask?.id || !currentUser || !currentUser.ssin) {
      this._toastService.showSomethingWentWrong();
      return;
    }

    this.loading.set(true);
    const ssin = currentUser.ssin;
    const discipline = currentUser.discipline || '';
    if (isPrescription(prescription.intent)) {
      this.selfAssign(
        () =>
          this._prescriptionStateService.assignPrescriptionToMe(
            prescription.id!,
            prescription.referralTask!.id!,
            { ssin, discipline },
            this.generatedUUID()
          ),
        'prescription'
      );
    } else {
      this.selfAssign(
        () =>
          this._proposalStateService.assignProposalToMe(
            prescription.id!,
            prescription.referralTask!.id!,
            { ssin, discipline },
            this.generatedUUID()
          ),
        'proposal'
      );
    }
  }

  private selfAssign(serviceCall: () => Observable<PerformerTaskIdResource>, successPrefix: string) {
    serviceCall().subscribe({
      next: () => {
        this.loading.set(false);
        this._toastService.show(successPrefix + '.assignPerformer.meSuccess');
      },
      error: () => {
        this.loading.set(false);
        this._toastService.showSomethingWentWrong();
      },
    });
  }
}
