import { computed, EventEmitter, inject, Injectable, Signal, signal, WritableSignal } from '@angular/core';
import {
  Discipline,
  OrganizationTaskResource,
  PerformerTaskResource,
  PersonResource,
  ReadRequestResource,
  RequestTaskResource,
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
import { MatDialog } from '@angular/material/dialog';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '@reuse/code/services/auth/auth.service';
import { PatientState } from '@reuse/code/states/api/patient.state';
import { IdentifyState } from '@reuse/code/states/privacy/identify.state';
import { EncryptionState } from '@reuse/code/states/privacy/encryption.state';
import { isPerformerTaskWithinOrganization, isProposal } from '@reuse/code/utils/utils';
import { DataState, IdToken, LoadingStatus, Params, UserInfo } from '@reuse/code/interfaces';
import { ProposalState } from '@reuse/code/states/api/proposal.state';
import { PrescriptionState } from '@reuse/code/states/api/prescription.state';
import { TemplateVersionsState } from '@reuse/code/states/api/template-versions.state';
import { DecryptedResponsesState } from '@reuse/code/interfaces/decrypted-responses-state.interface';
import { TemplatesState } from '@reuse/code/states/api/templates.state';
import { ApproveProposalDialog } from '@reuse/code/dialogs/approve-proposal/approve-proposal.dialog';
import { RejectProposalDialog } from '@reuse/code/dialogs/reject-proposal/reject-proposal.dialog';
import { SSIN_CLAIM_KEY, USER_PROFILE_CLAIM_KEY } from '@reuse/code/services/auth/auth-constants';
import { v4 as uuidv4 } from 'uuid';
import { AssignOrTransferDialog } from '@reuse/code/dialogs/assign-or-transfer-dialog/assign-or-transfer-dialog';
import { Lang } from '@reuse/code/constants/languages';
import { AlertService } from '@reuse/code/services/helpers/alert.service';
import { getConnectedOrganizationNihii } from '@reuse/code/utils/idToken.utils';

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
  private readonly alertService = inject(AlertService);

  readonly tokenClaims$ = toSignal(this.authService.getClaims());
  readonly isProfessional$ = toSignal(this.authService.isProfessional());
  readonly isOrganization$ = toSignal(this.authService.isOrganization());
  readonly role$ = toSignal(this.authService.role());
  readonly oidc$ = toSignal(this.authService.oidc());

  readonly discipline$: Signal<Discipline | undefined> = toSignal(this.authService.discipline());
  readonly currentLang: WritableSignal<string> = signal(Lang.FR.full);
  readonly loading: WritableSignal<boolean> = signal(false);
  readonly generatedUUID: WritableSignal<string> = signal('');
  readonly pssStatus: WritableSignal<boolean> = signal(false);
  readonly intent: WritableSignal<string | undefined> = signal(undefined);

  readonly templateCode$ = computed(() => {
    const intent = this.intent();
    if (!intent) return undefined;

    if (isProposal(this.intent())) {
      return this.proposalStateService.state().data?.templateCode;
    }
    return this.prescriptionStateService.state().data?.templateCode;
  });
  readonly decryptedResponses$: WritableSignal<DecryptedResponsesState> = signal({
    data: undefined,
    error: undefined,
  });

  // Initialized in prescription-details
  services!: DetailsServices;

  proposalApproved = new EventEmitter<{ prescriptionId: string }>();
  //Not used for the moment
  proposalsRejected = new EventEmitter<boolean>();

  getPatient = computed<DataState<PersonResource>>(() => {
    const patientState = this.patientStateService.state();
    const identifyState = this.identifyState.state();
    const ssin = identifyState.data;
    const professional = this.isProfessional$();
    const organization = this.isOrganization$();
    const userProfile = this.tokenClaims$()?.[USER_PROFILE_CLAIM_KEY] as PersonResource;

    if (professional || organization) {
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
  });

  getCryptoKey() {
    return this.encryptionStateService.state();
  }

  getPrescription(): DataState<ReadRequestResource> {
    const intent = this.intent();
    if (!intent) {
      return {
        status: LoadingStatus.INITIAL,
      };
    }

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
    const intent = this.intent();
    if (!intent) {
      return {
        status: LoadingStatus.INITIAL,
      };
    }

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

  getRequestTask(): DataState<RequestTaskResource> {
    const intent = this.intent();
    if (!intent) {
      return { status: LoadingStatus.INITIAL };
    }

    const state = isProposal(intent) ? this.proposalStateService.state() : this.prescriptionStateService.state();
    const claims = this.tokenClaims$();
    const ssin = (claims?.[USER_PROFILE_CLAIM_KEY] as PersonResource)?.[SSIN_CLAIM_KEY];
    const oidc = this.oidc$();
    const orgNihii = getConnectedOrganizationNihii(claims, oidc);

    const tasksMap = this.generateTaskMap(state, orgNihii, ssin);

    const firstTaskKey = tasksMap ? Object.keys(tasksMap)[0] : undefined;

    if ((!ssin && !orgNihii) || state.status !== LoadingStatus.SUCCESS || !firstTaskKey) {
      return {
        status: state.status,
        data: {} as PerformerTaskResource,
      };
    }

    const matchedTask = this.resolveTargetTask(tasksMap, firstTaskKey, ssin, orgNihii);

    if (matchedTask) {
      return {
        status: state.status,
        data: matchedTask,
      };
    }

    return { status: state.status };
  }

  private resolveTargetTask(
    tasksMap: { [key: string]: Array<RequestTaskResource> } | undefined,
    firstTaskKey: string,
    ssin?: string,
    orgNihii?: string
  ): RequestTaskResource | undefined {
    // If the first method returns undefined, it tries the next and so on.
    if (!tasksMap) return undefined;
    return (
      this.getPerformerTaskWithinOrganization(tasksMap, firstTaskKey, orgNihii) ??
      this.getDirectOrganizationTask(tasksMap, firstTaskKey, orgNihii) ??
      this.getDirectPerformerTask(tasksMap, ssin)
    );
  }

  private getPerformerTaskWithinOrganization(
    tasksMap: { [key: string]: Array<RequestTaskResource> },
    firstTaskKey: string,
    orgNihii?: string
  ): RequestTaskResource | undefined {
    if (!isPerformerTaskWithinOrganization(firstTaskKey) || !orgNihii) {
      return undefined;
    }
    if (this.isOrganization$() && orgNihii) {
      return tasksMap[orgNihii]?.[0];
    }

    const orgTasks = tasksMap[firstTaskKey] as OrganizationTaskResource[];
    return orgTasks?.[0]?.performerTasks?.[0];
  }

  private getDirectOrganizationTask(
    tasksMap: { [key: string]: Array<RequestTaskResource> },
    firstTaskKey: string,
    orgNihii?: string
  ): RequestTaskResource | undefined {
    if (!orgNihii) return undefined;

    if (!tasksMap[orgNihii] && tasksMap[firstTaskKey]) {
      return tasksMap[firstTaskKey] as RequestTaskResource;
    }
    return tasksMap[orgNihii]?.[0];
  }

  private getDirectPerformerTask(
    tasksMap: { [key: string]: Array<RequestTaskResource> },
    ssin?: string
  ): RequestTaskResource | undefined {
    if (!ssin) return undefined;
    return tasksMap[ssin]?.[0];
  }

  private generateTaskMap(
    state: DataState<ReadRequestResource, unknown, Params>,
    orgNihii: string | undefined,
    ssin: string | undefined
  ) {
    let tasks = state.data?.performerTasks;
    if (!tasks) return undefined;
    if (orgNihii && ssin) {
      const key = `${orgNihii}:${ssin}`;
      type Entry = [string, RequestTaskResource[]];

      const compareEntries = ([a]: Entry, [b]: Entry) => {
        if (a === key) return -1;
        if (b === key) return 1;
        return 0;
      };

      tasks = Object.fromEntries(Object.entries(tasks).sort(compareEntries));

      return tasks;
    }

    return tasks;
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
    const token = this.tokenClaims$()?.[USER_PROFILE_CLAIM_KEY];
    const role = this.role$();
    const discipline = this.discipline$();

    return token
      ? {
          status: LoadingStatus.SUCCESS,
          data: {
            ...token,
            role: role || Role.Patient,
            discipline: discipline,
          },
        }
      : { status: LoadingStatus.LOADING };
  }

  openRejectAssignationDialog(
    alertTarget: string,
    prescription: ReadRequestResource,
    task: RequestTaskResource,
    patient?: PersonResource
  ): void {
    this._dialog
      .open(RejectAssignationDialog, {
        data: {
          prescription: prescription,
          requestTask: task,
          patient: patient,
        },
        panelClass: 'mh-dialog-container',
      })
      .beforeClosed()
      .subscribe((data?: boolean) => {
        if (data) {
          this.generatedUUID.set(uuidv4());
        }
        this.alertService.setActive(alertTarget);
      });
  }

  openInterruptExecutionDialog(
    alertTarget: string,
    prescription: ReadRequestResource,
    task: PerformerTaskResource,
    patient?: PersonResource
  ): void {
    this._dialog
      .open(InterruptExecutionPrescriptionDialog, {
        data: {
          prescription: prescription,
          performerTask: task,
          patient: patient,
        },
        panelClass: 'mh-dialog-container',
      })
      .beforeClosed()
      .subscribe(() => {
        this.alertService.setActive(alertTarget);
      });
  }

  openRestartExecutionDialog(
    alertTarget: string,
    prescription: ReadRequestResource,
    task: PerformerTaskResource,
    patient: PersonResource
  ): void {
    this._dialog
      .open(RestartExecutionPrescriptionDialog, {
        data: {
          prescription: prescription,
          performerTask: task,
          patient: patient,
        },
        panelClass: 'mh-dialog-container',
      })
      .beforeClosed()
      .subscribe(() => {
        this.alertService.setActive(alertTarget);
      });
  }

  openStartExecutionDialog(alertTarget: string, prescription: ReadRequestResource, task?: PerformerTaskResource): void {
    this._dialog
      .open(StartExecutionPrescriptionDialog, {
        data: {
          prescription: prescription,
          performerTask: task,
          startExecutionDate: task?.executionPeriod?.start,
        },
        panelClass: 'mh-dialog-container',
      })
      .beforeClosed()
      .subscribe(() => {
        this.alertService.setActive(alertTarget);
      });
  }

  openFinishExecutionDialog(alertTarget: string, prescription: ReadRequestResource, task: PerformerTaskResource): void {
    this._dialog
      .open(FinishExecutionPrescriptionDialog, {
        data: {
          prescription: prescription,
          performerTask: task,
          startExecutionDate: task.executionPeriod?.start,
        },
        panelClass: 'mh-dialog-container',
      })
      .beforeClosed()
      .subscribe(() => {
        this.alertService.setActive(alertTarget);
      });
  }

  openCancelExecutionDialog(
    alertTarget: string,
    prescription: ReadRequestResource,
    task: PerformerTaskResource,
    patient?: PersonResource
  ): void {
    this._dialog
      .open(CancelExecutionPrescriptionDialog, {
        data: {
          prescription: prescription,
          performerTask: task,
          patient: patient,
        },
        panelClass: 'mh-dialog-container',
      })
      .beforeClosed()
      .subscribe(() => {
        this.alertService.setActive(alertTarget);
      });
  }

  openTransferAssignationDialog(
    alertTarget: string,
    prescription: ReadRequestResource,
    task: PerformerTaskResource
  ): void {
    this._dialog
      .open(AssignOrTransferDialog, {
        data: {
          prescriptionId: prescription.id,
          referralTaskId: prescription.referralTask?.id,
          performerTaskId: task.id,
          assignedCareGivers: Object.keys(prescription.performerTasks ?? {}),
          category: prescription.category,
          intent: prescription.intent,
          mode: 'transfer',
        },
        panelClass: ['mh-dialog-container', 'mh-assign-dialog'],
        maxHeight: '90vh',
      })
      .beforeClosed()
      .subscribe(() => {
        this.alertService.setActive(alertTarget);
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

  openApproveProposalDialog(alertTarget: string, proposal: ReadRequestResource) {
    this._dialog
      .open(ApproveProposalDialog, {
        data: {
          proposal: proposal,
        },
        panelClass: 'mh-dialog-container',
      })
      .beforeClosed()
      .subscribe((data?: { prescriptionId: string }) => {
        this.alertService.setActive(alertTarget);
        if (data?.prescriptionId) {
          this.proposalApproved.next({ prescriptionId: data.prescriptionId });
        }
      });
  }

  openRejectProposalDialog(alertTarget: string, proposal: ReadRequestResource) {
    this._dialog
      .open(RejectProposalDialog, {
        data: {
          proposal: proposal,
        },
        panelClass: 'mh-dialog-container',
      })
      .beforeClosed()
      .subscribe(() => {
        this.alertService.setActive(alertTarget);
      });
  }
}
