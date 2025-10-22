import { computed, EventEmitter, inject, Injectable, Signal, signal, WritableSignal } from '@angular/core';
import {
  Discipline,
  PerformerTaskResource,
  PersonResource,
  ReadRequestResource,
  Role,
  Template,
  TemplateVersion,
} from '@reuse/code/openapi';
import { RejectAssignationDialog } from '@reuse/code/dialogs/reject-assignation/reject-assignation.dialog';
import { InterruptExecutionPrescriptionDialog } from '@reuse/code/dialogs/interrupt-execution-prescription/interrupt-execution-prescription.dialog';
import { RestartExecutionPrescriptionDialog } from '@reuse/code/dialogs/restart-execution-prescription/restart-execution-prescription.dialog';
import { StartExecutionPrescriptionDialog } from '@reuse/code/dialogs/start-execution-prescription/start-execution-prescription.dialog';
import { FinishExecutionPrescriptionDialog } from '@reuse/code/dialogs/finish-execution-prescription/finish-execution-prescription.dialog';
import { CancelExecutionPrescriptionDialog } from '@reuse/code/dialogs/cancel-execution-prescription/cancel-execution-prescription.dialog';
import { TransferAssignationDialog } from '@reuse/code/dialogs/transfer-assignation/transfer-assignation.dialog';
import { MatDialog } from '@angular/material/dialog';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '@reuse/code/services/auth/auth.service';
import { PatientState } from '@reuse/code/states/api/patient.state';
import { IdentifyState } from '@reuse/code/states/privacy/identify.state';
import { EncryptionState } from '@reuse/code/states/privacy/encryption.state';
import { isProposal } from '@reuse/code/utils/utils';
import { DataState, IdToken, LoadingStatus, UserInfo } from '@reuse/code/interfaces';
import { ProposalState } from '@reuse/code/states/api/proposal.state';
import { PrescriptionState } from '@reuse/code/states/api/prescription.state';
import { TemplateVersionsState } from '@reuse/code/states/api/template-versions.state';
import { DecryptedResponsesState } from '@reuse/code/interfaces/decrypted-responses-state.interface';
import { TemplatesState } from '@reuse/code/states/api/templates.state';
import { ApproveProposalDialog } from '@reuse/code/dialogs/approve-proposal/approve-proposal.dialog';
import { RejectProposalDialog } from '@reuse/code/dialogs/reject-proposal/reject-proposal.dialog';

export interface DetailsServices {
  getAccessToken: (audience?: string) => Promise<string | null>;
  getIdToken: () => IdToken;
}

@Injectable({
  providedIn: 'root',
})
export class PrescriptionDetailsSecondaryService {
  private readonly _dialog = inject(MatDialog);
  private readonly authService = inject(AuthService);
  private readonly patientStateService = inject(PatientState);
  private readonly identifyState: IdentifyState = inject(IdentifyState);
  private readonly encryptionStateService: EncryptionState = inject(EncryptionState);
  private readonly proposalStateService: ProposalState = inject(ProposalState);
  private readonly prescriptionStateService: PrescriptionState = inject(PrescriptionState);
  private readonly templateVersionsStateService: TemplateVersionsState = inject(TemplateVersionsState);
  private readonly templatesStateService: TemplatesState = inject(TemplatesState);

  readonly tokenClaims$ = toSignal(this.authService.getClaims());
  readonly isProfessional$ = toSignal(this.authService.isProfessional());
  readonly discipline$: Signal<Discipline | undefined> = toSignal(this.authService.discipline());
  readonly currentLang: WritableSignal<string> = signal('fr-BE');
  readonly loading: WritableSignal<boolean> = signal(false);
  readonly generatedUUID: WritableSignal<string> = signal('');

  readonly templateCode$ = computed(() => {
    if (isProposal(this.intent())) {
      return this.proposalStateService.state().data?.templateCode;
    }
    return this.prescriptionStateService.state().data?.templateCode;
  });
  readonly decryptedResponses$: WritableSignal<DecryptedResponsesState> = signal({
    data: undefined,
    error: undefined,
  });
  readonly pssStatus: WritableSignal<boolean> = signal(false);
  readonly intent: WritableSignal<string> = signal('');

  // Initialized in prescription-details
  services!: DetailsServices;

  proposalApproved = new EventEmitter<{ prescriptionId: string }>();
  //Not used for the moment
  proposalsRejected = new EventEmitter<boolean>();

  getPatient(): DataState<PersonResource> {
    const patientState = this.patientStateService.state();
    const identifyState = this.identifyState.state();
    const ssin = identifyState.data;
    const professional = this.isProfessional$();
    const userProfile = this.tokenClaims$()?.['userProfile'] as PersonResource;

    if (professional) {
      const person: PersonResource = {
        ...patientState.data,
        ssin: ssin,
      };
      return { ...patientState, data: person };
    }

    const person: PersonResource = {
      ...userProfile,
      ssin: ssin,
    };
    return {
      status: identifyState.status,
      data: person,
    };
  }

  getCryptoKey() {
    return this.encryptionStateService.state();
  }

  getPrescription(): DataState<ReadRequestResource> {
    const prescriptionState = isProposal(this.intent())
      ? this.proposalStateService.state()
      : this.prescriptionStateService.state();
    const templateCode = this.templateCode$();
    const cryptoKey = this.encryptionStateService.state().data;
    const template = this.templateVersionsStateService.getState('READ_' + templateCode)()?.data;
    const cryptoKeyIsNeeded = !cryptoKey && prescriptionState.data?.pseudonymizedKey;

    if (cryptoKeyIsNeeded || !template) {
      return { data: prescriptionState.data, status: LoadingStatus.LOADING };
    }

    if (prescriptionState.status !== LoadingStatus.SUCCESS) {
      return prescriptionState;
    }

    const prescription = prescriptionState.data;

    if (template && cryptoKey && prescription?.responses) {
      return {
        ...prescriptionState,
        status: LoadingStatus.SUCCESS,
      };
    }

    return prescriptionState;
  }

  getDecryptedResponses(): DataState<Record<string, unknown>> {
    const responses = this.decryptedResponses$();
    const prescriptionState = isProposal(this.intent())
      ? this.proposalStateService.state()
      : this.prescriptionStateService.state();

    const needsPseudonymizedKey =
      (prescriptionState.data?.responses && prescriptionState.data.templateCode != 'ANNEX_81') ||
      prescriptionState.data?.responses?.['note'];

    if (
      prescriptionState.status === LoadingStatus.SUCCESS &&
      !prescriptionState.data?.pseudonymizedKey &&
      needsPseudonymizedKey
    ) {
      return {
        ...responses,
        error: { decryptedResponses: 'Pseudonymized key missing' },
        status: LoadingStatus.ERROR,
      };
    }

    if (responses?.error) {
      return { ...responses, status: LoadingStatus.ERROR };
    }

    return responses ? { status: LoadingStatus.SUCCESS, data: responses.data } : { status: LoadingStatus.LOADING };
  }

  getPerformerTask(): DataState<PerformerTaskResource> {
    const state = isProposal(this.intent()) ? this.proposalStateService.state() : this.prescriptionStateService.state();
    const ssin = (this.tokenClaims$()?.['userProfile'] as PersonResource)?.['ssin'];
    if (!ssin || state.status !== LoadingStatus.SUCCESS) {
      return {
        status: state.status,
        data: {} as PerformerTaskResource,
      };
    }

    const directPerformerTask = state.data!.performerTasks?.find(t => t.careGiverSsin === ssin);
    if (directPerformerTask) {
      return {
        status: state.status,
        data: directPerformerTask,
      };
    }

    const organizationTask = state.data!.organizationTasks?.find(ot =>
      ot.performerTasks?.some(pt => pt.careGiverSsin === ssin)
    );

    const nestedPerformerTask = organizationTask?.performerTasks?.find(t => t.careGiverSsin === ssin);
    return nestedPerformerTask
      ? {
          status: state.status,
          data: nestedPerformerTask,
        }
      : {
          status: state.status,
        };
  }

  getTemplate(): DataState<Template | undefined> {
    const templateCode = this.templateCode$();
    const templatesState = this.templatesStateService.state();
    return this.getPrescriptionTemplateStream(templateCode, templatesState);
  }

  getTemplateVersion(): DataState<TemplateVersion> {
    const templateCode = this.templateCode$();
    return templateCode
      ? this.templateVersionsStateService.getState('READ_' + templateCode)()
      : { status: LoadingStatus.LOADING };
  }

  getCurrentUser(): DataState<Partial<UserInfo>> {
    const token = this.tokenClaims$()?.['userProfile'];
    const professional = this.isProfessional$();
    const discipline = this.discipline$();

    return token
      ? {
          status: LoadingStatus.SUCCESS,
          data: {
            ...token,
            role: professional ? Role.Prescriber : Role.Patient,
            discipline: discipline,
          },
        }
      : { status: LoadingStatus.LOADING };
  }

  openRejectAssignationDialog(
    prescription: ReadRequestResource,
    task: PerformerTaskResource,
    patient?: PersonResource
  ): void {
    this._dialog.open(RejectAssignationDialog, {
      data: {
        prescription: prescription,
        performerTask: task,
        patient: patient,
      },
      panelClass: 'mh-dialog-container',
    });
  }

  openInterruptExecutionDialog(
    prescription: ReadRequestResource,
    task: PerformerTaskResource,
    patient?: PersonResource
  ): void {
    this._dialog.open(InterruptExecutionPrescriptionDialog, {
      data: {
        prescription: prescription,
        performerTask: task,
        patient: patient,
      },
      panelClass: 'mh-dialog-container',
    });
  }

  openRestartExecutionDialog(
    prescription: ReadRequestResource,
    task: PerformerTaskResource,
    patient: PersonResource
  ): void {
    this._dialog.open(RestartExecutionPrescriptionDialog, {
      data: {
        prescription: prescription,
        performerTask: task,
        patient: patient,
      },
      panelClass: 'mh-dialog-container',
    });
  }

  openStartExecutionDialog(prescription: ReadRequestResource, task?: PerformerTaskResource): void {
    this._dialog.open(StartExecutionPrescriptionDialog, {
      data: {
        prescription: prescription,
        performerTask: task,
        startExecutionDate: task?.executionPeriod?.start,
      },
      panelClass: 'mh-dialog-container',
    });
  }

  openFinishExecutionDialog(prescription: ReadRequestResource, task: PerformerTaskResource): void {
    this._dialog.open(FinishExecutionPrescriptionDialog, {
      data: {
        prescription: prescription,
        performerTask: task,
        startExecutionDate: task.executionPeriod?.start,
      },
      panelClass: 'mh-dialog-container',
    });
  }

  openCancelExecutionDialog(
    prescription: ReadRequestResource,
    task: PerformerTaskResource,
    patient?: PersonResource
  ): void {
    this._dialog.open(CancelExecutionPrescriptionDialog, {
      data: {
        prescription: prescription,
        performerTask: task,
        patient: patient,
      },
      panelClass: 'mh-dialog-container',
    });
  }

  openTransferAssignationDialog(prescription: ReadRequestResource, task: PerformerTaskResource): void {
    this._dialog.open(TransferAssignationDialog, {
      data: {
        prescriptionId: prescription.id,
        referralTaskId: prescription.referralTask?.id,
        performerTaskId: task.id,
        assignedCareGivers: prescription.performerTasks?.map(c => c.careGiverSsin),
        category: prescription.category,
        intent: prescription.intent,
      },
      panelClass: 'mh-dialog-container',
    });
  }

  private getPrescriptionTemplateStream(
    templateCode: string | undefined,
    templatesState: DataState<Template[]>
  ): DataState<Template | undefined> {
    if (!templateCode || templatesState.status !== LoadingStatus.SUCCESS) {
      return { ...templatesState, data: undefined };
    }

    return {
      ...templatesState,
      data: templatesState.data!.find(t => t.code === templateCode),
    };
  }

  openApproveProposalDialog(proposal: ReadRequestResource) {
    this._dialog
      .open(ApproveProposalDialog, {
        data: {
          proposal: proposal,
        },
        panelClass: 'mh-dialog-container',
      })
      .beforeClosed()
      .subscribe((data?: { prescriptionId: string }) => {
        if (data?.prescriptionId) {
          this.proposalApproved.next({ prescriptionId: data.prescriptionId });
        }
      });
  }

  openRejectProposalDialog(proposal: ReadRequestResource) {
    this._dialog.open(RejectProposalDialog, {
      data: {
        proposal: proposal,
      },
      panelClass: 'mh-dialog-container',
    });
  }
}
