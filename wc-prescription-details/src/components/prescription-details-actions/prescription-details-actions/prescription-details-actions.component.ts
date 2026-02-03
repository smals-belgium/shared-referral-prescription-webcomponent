import { Component, EventEmitter, inject, Input, Output, WritableSignal } from '@angular/core';
import { CanCancelPrescriptionOrProposalPipe } from '@reuse/code/pipes/can-cancel-prescription-or-proposal.pipe';
import { CanDuplicatePrescriptionPipe } from '@reuse/code/pipes/can-duplicate-prescription.pipe';
import { CanExtendPrescriptionPipe } from '@reuse/code/pipes/can-extend-prescription.pipe';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatDivider } from '@angular/material/divider';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { TranslatePipe } from '@ngx-translate/core';
import { DeviceService } from '@reuse/code/services/helpers/device.service';
import { MatIconModule } from '@angular/material/icon';
import {
  FhirR4TaskStatus,
  PerformerTaskIdResource,
  PerformerTaskResource,
  PersonResource,
  ReadRequestResource,
} from '@reuse/code/openapi';
import { CanAssignCaregiverPipe } from '@reuse/code/pipes/can-assign-caregiver.pipe';
import { CanSelfAssignPipe } from '@reuse/code/pipes/can-self-assign.pipe';
import { CanStartTreatmentPipe } from '@reuse/code/pipes/can-start-treatment.pipe';
import { AssignPrescriptionDialog } from '@reuse/code/dialogs/assign-prescription/assign-prescription.dialog';
import { UserInfo } from '@reuse/code/interfaces';
import { isPrescription } from '@reuse/code/utils/utils';
import { Observable } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ToastService } from '@reuse/code/services/helpers/toast.service';
import { PrescriptionState } from '@reuse/code/states/api/prescription.state';
import { ProposalState } from '@reuse/code/states/api/proposal.state';
import { PrescriptionDetailsSecondaryService } from '../../prescription-details-secondary/prescription-details-secondary.service';
import { ViewState } from '../../../containers/prescription-details/prescription-details.component';
import { PrescriptionsPdfService } from '@reuse/code/services/helpers/prescription-pdf.service';
import { FormTemplate } from '@smals-belgium-shared/vas-evaluation-form-ui-core';
import { CancelPrescriptionDialog } from '@reuse/code/dialogs/cancel-prescription/cancel-prescription-dialog.component';
import { TaskButtonGroupComponent } from '../task-button-group/task-button-group.component';

@Component({
  selector: 'app-prescription-details-actions',
  imports: [
    CanCancelPrescriptionOrProposalPipe,
    CanDuplicatePrescriptionPipe,
    CanExtendPrescriptionPipe,
    MatButton,
    MatIconButton,
    MatDivider,
    MatIconModule,
    MatMenu,
    MatMenuItem,
    TranslatePipe,
    MatMenuTrigger,
    CanAssignCaregiverPipe,
    CanSelfAssignPipe,
    CanStartTreatmentPipe,
    TaskButtonGroupComponent,
  ],
  templateUrl: './prescription-details-actions.component.html',
  styleUrl: './prescription-details-actions.component.scss',
})
export class PrescriptionDetailsActionsComponent {
  protected readonly _deviceService = inject(DeviceService);
  protected readonly prescriptionSecondaryService = inject(PrescriptionDetailsSecondaryService);

  private readonly _prescriptionsPdfService = inject(PrescriptionsPdfService);
  private readonly _service = inject(PrescriptionDetailsSecondaryService);
  private readonly _dialog = inject(MatDialog);
  private readonly _toastService = inject(ToastService);
  private readonly _prescriptionStateService = inject(PrescriptionState);
  private readonly _proposalStateService = inject(ProposalState);

  readonly currentUserServiceData: Partial<UserInfo> | undefined = this._service.getCurrentUser().data;
  readonly performerTaskServiceData: PerformerTaskResource | undefined = this._service.getPerformerTask().data;

  readonly loading: WritableSignal<boolean> = this._service.loading;
  readonly generatedUUID = this._service.generatedUUID;

  @Input({ required: true }) data: ViewState | undefined;
  get prescription() {
    return this.data?.prescription;
  }
  get patient() {
    return this.data?.patient;
  }
  get currentUser() {
    return this.data?.currentUser;
  }

  @Input({ required: true }) currentLang: string | undefined;

  @Output() print = new EventEmitter<Blob>();
  @Output() download = new EventEmitter<Blob>();
  @Output() handleDuplicate = new EventEmitter<ReadRequestResource>();
  @Output() handleExtend = new EventEmitter<ReadRequestResource>();

  createPdf(type: 'print' | 'download'): void {
    if (this.data?.decryptedResponses && this.data.template && this.data.templateVersion && this.currentLang) {
      this.loading.set(true);
      this._prescriptionsPdfService
        .createCommonPdf(
          this.data.prescription,
          this.data.decryptedResponses,
          this.data.patient,
          this.data.template,
          this.data.templateVersion as FormTemplate,
          this.currentLang
        )
        .getBlob((blob: Blob) => {
          if (type === 'print') {
            this.print.emit(blob);
          } else {
            this.download.emit(blob);
          }
          this.loading.set(false);
        });
    }
  }

  openCancelPrescriptionDialog(prescription: ReadRequestResource, patient?: PersonResource): void {
    this._dialog.open(CancelPrescriptionDialog, {
      data: {
        prescription,
        patient,
      },
      panelClass: 'mh-dialog-container',
    });
  }

  handleDuplicateClick() {
    const prescription = this.data?.prescription;
    const responses = this.data?.decryptedResponses;
    if (prescription && responses) {
      const duplicatedData = { ...prescription, responses: responses };
      this.handleDuplicate.emit(duplicatedData);
    }
  }

  handleExtendClick() {
    const prescription = this.data?.prescription;
    const responses = this.data?.decryptedResponses;
    if (prescription && responses) {
      const duplicatedData = { ...prescription, responses: responses };
      this.handleExtend.emit(duplicatedData);
    }
  }

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
      maxHeight: '90vh',
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

  getPerformerTask(prescription: ReadRequestResource): PerformerTaskResource | undefined {
    const targetId = this.performerTaskServiceData?.id;
    if (!targetId) return undefined;

    const performerTask = prescription.performerTasks?.find(pt => pt.id === targetId);
    if (performerTask) return performerTask;

    return prescription.organizationTasks
      ?.flatMap(organizationTask => organizationTask.performerTasks ?? [])
      .find(performerTask => performerTask.id === targetId);
  }
}
