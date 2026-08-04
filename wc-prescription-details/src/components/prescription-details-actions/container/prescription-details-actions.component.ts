import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
  signal,
  WritableSignal,
} from '@angular/core';
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
  AssignationType,
  AssignCareGiverResource,
  PerformerTaskIdResource,
  PersonResource,
  ReadRequestResource,
  RequestTaskResource,
  Role,
} from '@reuse/code/openapi';
import { CanAssignCaregiverPipe } from '@reuse/code/pipes/can-assign-caregiver.pipe';
import { CanSelfAssignPipe } from '@reuse/code/pipes/can-self-assign.pipe';
import { CanStartTreatmentPipe } from '@reuse/code/pipes/can-start-treatment.pipe';
import { Intent, UserInfo } from '@reuse/code/interfaces';
import { isPrescription, normalizePromiseRejectReason } from '@reuse/code/utils/utils';
import { Observable } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ToastService } from '@reuse/code/services/helpers/toast.service';
import { PrescriptionState } from '@reuse/code/states/api/prescription.state';
import { ProposalState } from '@reuse/code/states/api/proposal.state';
import { PrescriptionDetailsSecondaryService } from '../../prescription-details-secondary/services/prescription-details-secondary.service';
import { ViewState } from '../../../prescription-details/prescription-details.component';
import { PrescriptionsPdfService } from '@reuse/code/services/helpers/prescription-pdf.service';
import { FormTemplate } from '@smals-belgium-shared/vas-evaluation-form-ui-core';
import { CancelPrescriptionDialog } from '@reuse/code/dialogs/cancel-prescription/cancel-prescription-dialog.component';
import { TaskButtonGroupComponent } from '../components/task-button-group/task-button-group.component';
import { AssignOrTransferDialog } from '@reuse/code/dialogs/assign-or-transfer-dialog/assign-or-transfer-dialog';
import { AlertService } from '@reuse/code/services/helpers/alert.service';
import { CanAutoAssignCaregiversPipe } from '@reuse/code/pipes/can-auto-assign-caregivers.pipe';
import { WcDetailsEvent } from '@reuse/code/interfaces/events.interface';
import { v4 as uuidv4 } from 'uuid';
import { CanPrintPrescriptionPipe } from '@reuse/code/pipes/can-print-prescription.pipe';
import { checkAndConvertToPerformerTask } from '@reuse/code/utils/task-type.util';
import { ALERT_TARGET } from '@reuse/code/constants/error';

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
    CanAutoAssignCaregiversPipe,
    CanPrintPrescriptionPipe,
  ],
  templateUrl: './prescription-details-actions.component.html',
  styleUrl: './prescription-details-actions.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  private readonly alertService = inject(AlertService);
  protected readonly alertTarget = inject(ALERT_TARGET);

  readonly currentUserServiceData: Partial<UserInfo> | undefined = this._service.getCurrentUser().data;
  readonly requestTaskServiceData: RequestTaskResource | undefined = this._service.getRequestTask().data;

  readonly loading: WritableSignal<boolean> = this._service.loading;
  readonly generatedUUID = this._service.generatedUUID;
  readonly loadingActions: WritableSignal<boolean> = signal(false);
  protected readonly Intent = Intent;
  protected readonly checkAndConvertToPerformerTask = checkAndConvertToPerformerTask;

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
  @Output() handleAutoAssign = new EventEmitter<WcDetailsEvent>();

  private dispatchToHost<T>(actionType: WcDetailsEvent['type']): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.handleAutoAssign.emit({
        type: actionType,
        payload: { resolve, reject },
      } as WcDetailsEvent);
    });
  }

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
    this._dialog
      .open(CancelPrescriptionDialog, {
        data: {
          prescription,
          patient,
        },
        panelClass: 'mh-dialog-container',
      })
      .beforeClosed()
      .subscribe(() => {
        this.alertService.setActive(this.alertTarget);
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
    this._dialog
      .open(AssignOrTransferDialog, {
        data: {
          prescriptionId: prescription.id,
          referralTaskId: prescription.referralTask?.id,
          category: prescription.category,
          intent: prescription.intent,
          mode: 'assign',
        },
        panelClass: ['mh-dialog-container', 'mh-assign-dialog'],
        maxHeight: '90vh',
      })
      .beforeClosed()
      .subscribe(() => {
        this.alertService.setActive(this.alertTarget);
      });
  }

  async openAutoAssign(prescription: ReadRequestResource): Promise<void> {
    if (!prescription.id || !prescription.referralTask?.id) {
      this.alertService.showGeneralError(this.alertTarget);
      return;
    }

    this.loadingActions.set(true);
    const uuid = uuidv4();

    try {
      // We just ask for data and trust the host to respond eventually
      const assignees = await this.dispatchToHost<AssignCareGiverResource[]>('FETCH_PROFESSIONAL_DATA');
      this.assignCaregivers(
        prescription.id,
        prescription.referralTask.id,
        assignees,
        uuid,
        prescription.intent,
        AssignationType.Internal
      );
    } catch (reason: unknown) {
      const msg = normalizePromiseRejectReason(reason);
      this.alertService.showGeneralError(this.alertTarget, msg, { retry: false });
      this.loadingActions.set(false);
    }
  }

  private assignCaregivers(
    prescriptionId: string,
    taskId: string,
    assignees: AssignCareGiverResource[],
    uuid: string,
    intent?: string,
    assignationType?: AssignationType
  ) {
    const successPrefix = isPrescription(intent) ? 'prescription' : 'proposal';
    const _assignationType = assignationType ?? AssignationType.External;
    this._prescriptionStateService
      .assignMultipleCaregivers(prescriptionId, taskId, assignees, uuid, _assignationType)
      .subscribe({
        next: () => {
          this.loadingActions.set(false);
          this._toastService.show(successPrefix + '.autoAssign.success');
        },
        error: () => {
          this.loadingActions.set(false);
        },
      });
  }

  onSelfAssign(prescription: ReadRequestResource, currentUser?: Partial<UserInfo>): void {
    if (!prescription.id || !prescription.referralTask?.id || !(currentUser?.ssin || currentUser?.organizations)) {
      this._toastService.showSomethingWentWrong();
      return;
    }

    this.loading.set(true);
    let ssinOrNihii = currentUser.ssin;
    let discipline = currentUser.discipline || '';
    let type = 'Professional';
    if (currentUser.organizations) {
      const organizationEntry = Object.entries(currentUser.organizations[0])[0];
      ssinOrNihii = organizationEntry[1].nihii;
      type = organizationEntry[0];
      discipline = '';
    }

    if (!ssinOrNihii) {
      this.loading.set(false);
      this._toastService.showSomethingWentWrong();
      return;
    }

    if (isPrescription(prescription.intent)) {
      this.selfAssign(
        () =>
          this._prescriptionStateService.assignPrescriptionPerformer(
            prescription.id!,
            prescription.referralTask!.id!,
            ssinOrNihii,
            discipline,
            type,
            this.generatedUUID()
          ),
        'prescription'
      );
    } else {
      this.selfAssign(
        () =>
          this._proposalStateService.assignProposalPerformer(
            prescription.id!,
            prescription.referralTask!.id!,
            ssinOrNihii,
            discipline,
            type,
            this.generatedUUID()
          ),
        'proposal'
      );
    }
  }

  private selfAssign(
    serviceCall: () => Observable<PerformerTaskIdResource | PerformerTaskIdResource[]>,
    successPrefix: string
  ) {
    serviceCall().subscribe({
      next: () => {
        this.generatedUUID.set(uuidv4());
        this.loading.set(false);
        this._toastService.show(successPrefix + '.assignPerformer.meSuccess');
      },
      error: () => {
        this.generatedUUID.set(uuidv4());
        this.loading.set(false);
        this._toastService.showSomethingWentWrong();
      },
    });
  }

  protected readonly Role = Role;
}
