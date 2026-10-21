import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { ERROR_PRESCRIPTION_DETAILS } from '@reuse/code/constants/error';
import { ApproveProposalDialog } from '@reuse/code/dialogs/approve-proposal/approve-proposal.dialog';
import { AssignOrTransferDialog } from '@reuse/code/dialogs/assign-or-transfer-dialog/assign-or-transfer-dialog';
import { CancelExecutionPrescriptionDialog } from '@reuse/code/dialogs/cancel-execution-prescription/cancel-execution-prescription.dialog';
import { FinishExecutionPrescriptionDialog } from '@reuse/code/dialogs/finish-execution-prescription/finish-execution-prescription.dialog';
import { InterruptExecutionPrescriptionDialog } from '@reuse/code/dialogs/interrupt-execution-prescription/interrupt-execution-prescription.dialog';
import { RejectAssignationDialog } from '@reuse/code/dialogs/reject-assignation/reject-assignation.dialog';
import { RejectProposalDialog } from '@reuse/code/dialogs/reject-proposal/reject-proposal.dialog';
import { RestartExecutionPrescriptionDialog } from '@reuse/code/dialogs/restart-execution-prescription/restart-execution-prescription.dialog';
import { StartExecutionPrescriptionDialog } from '@reuse/code/dialogs/start-execution-prescription/start-execution-prescription.dialog';
import { DataState, Intent, LoadingStatus, Params, TemplateCodes, UserInfo } from '@reuse/code/interfaces';
import {
  AssignationType,
  Discipline,
  PersonResource,
  ReadRequestResource,
  RequestTaskResource,
  Template,
} from '@reuse/code/openapi';
import { PersonService } from '@reuse/code/services/api/person.service';
import { AuthService } from '@reuse/code/services/auth/auth.service';
import { ConfigurationService } from '@reuse/code/services/config/configuration.service';
import { PatientState } from '@reuse/code/states/api/patient.state';
import { PrescriptionState } from '@reuse/code/states/api/prescription.state';
import { ProposalState } from '@reuse/code/states/api/proposal.state';
import { TemplateVersionsState } from '@reuse/code/states/api/template-versions.state';
import { TemplatesState } from '@reuse/code/states/api/templates.state';
import { EncryptionState } from '@reuse/code/states/privacy/encryption.state';
import { IdentifyState } from '@reuse/code/states/privacy/identify.state';
import { PseudonymisationHelper } from '@smals-belgium-shared/pseudo-helper';
import { of, throwError } from 'rxjs';
import {
  FakeLoader,
  mockAuthService,
  mockConfigService,
  mockPerformerTask,
  mockPerson,
  mockPersonService,
  MockPseudoHelperFactory,
  mockTemplate,
  prescriptionResponse,
  referralTask,
} from '../../../../test.utils';
import { PrescriptionDetailsSecondaryService } from './prescription-details-secondary.service';
import { Signal, signal } from '@angular/core';
import { ToastService } from '@reuse/code/services/helpers/toast.service';

jest.mock('@reuse/code/utils/idToken.utils', () => ({
  ...jest.requireActual('@reuse/code/utils/idToken.utils'),
  getConnectedOrganizationNihii: jest.fn(),
}));

type StateMock<T extends { state: Signal<unknown> }> = Partial<Omit<jest.Mocked<T>, 'state'>> & { state: T['state'] };
const UserNurse: Partial<UserInfo> = { ssin: 'user-ssin', discipline: Discipline.Nurse };

describe('PrescriptionDetailsSecondaryService', () => {
  let service: PrescriptionDetailsSecondaryService;
  let dialog: MatDialog;
  let consoleSpy: jest.SpyInstance;
  let mockPatientState: StateMock<PatientState>;
  let mockIdentifyState: StateMock<IdentifyState>;
  let mockEncryptionState: StateMock<EncryptionState>;
  let mockPrescriptionState: StateMock<PrescriptionState>;
  let mockProposalState: StateMock<ProposalState>;
  let mockTemplatesState: StateMock<TemplatesState>;

  let mockDialogRef: { beforeClosed: jest.Mock };
  let mockDialog: jest.Mocked<MatDialog>;

  let mockTemplateVersionsState: Partial<jest.Mocked<TemplateVersionsState>>;
  let mockToastService: jest.Mocked<Partial<ToastService>>;

  let patientState: ReturnType<typeof createStateSignal<PersonResource>>;
  let identifyState: ReturnType<typeof createStateSignal<string>>;
  let encryptionState: ReturnType<typeof createStateSignal<CryptoKey>>;
  let prescriptionState: ReturnType<typeof createStateSignal<ReadRequestResource>>;
  let templatesState: ReturnType<typeof createStateSignal<Template[]>>;
  let proposalState: ReturnType<typeof createStateSignal<ReadRequestResource>>;

  const prescription = prescriptionResponse(null, [mockPerformerTask]) as unknown as ReadRequestResource;

  beforeAll(() => {
    consoleSpy = jest.spyOn(global.console, 'error').mockImplementation(message => {
      if (!message?.message?.includes('Could not parse CSS stylesheet')) {
        global.console.warn(message);
      }
    });
  });

  beforeEach(() => {
    patientState = createStateSignal<PersonResource>();
    identifyState = createStateSignal<string>();
    encryptionState = createStateSignal<CryptoKey>();
    prescriptionState = createStateSignal<ReadRequestResource>();
    templatesState = createStateSignal<Template[]>();
    proposalState = createStateSignal<ReadRequestResource>();

    mockIdentifyState = { state: identifyState };
    mockEncryptionState = { state: encryptionState };
    mockPatientState = {
      state: patientState,
      loadPatient: jest.fn(),
      setPatient: jest.fn(),
    };

    mockPrescriptionState = {
      state: prescriptionState,
      loadPrescription: jest.fn(),
      assignPrescriptionPerformer: jest.fn(),
    };
    mockTemplatesState = { state: templatesState };
    mockProposalState = { state: proposalState, assignProposalPerformer: jest.fn() };
    mockToastService = { show: jest.fn(), showSomethingWentWrong: jest.fn() };

    mockTemplateVersionsState = { getState: jest.fn() };

    mockDialogRef = {
      beforeClosed: jest.fn().mockReturnValue(of(true)),
    };

    mockDialog = {
      open: jest.fn().mockReturnValue(mockDialogRef),
    } as any;

    TestBed.configureTestingModule({
      imports: [
        MatDialogModule,
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: FakeLoader },
        }),
      ],
      providers: [
        PrescriptionDetailsSecondaryService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PersonService, useValue: mockPersonService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: PseudonymisationHelper, useValue: MockPseudoHelperFactory() },
        { provide: ConfigurationService, useValue: mockConfigService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: IdentifyState, useValue: mockIdentifyState },
        { provide: PatientState, useValue: mockPatientState },
        { provide: EncryptionState, useValue: mockEncryptionState },
        { provide: PrescriptionState, useValue: mockPrescriptionState },
        { provide: TemplateVersionsState, useValue: mockTemplateVersionsState },
        { provide: TemplatesState, useValue: mockTemplatesState },
        { provide: ProposalState, useValue: mockProposalState },
        { provide: ToastService, useValue: mockToastService },
      ],
    });

    service = TestBed.inject(PrescriptionDetailsSecondaryService);
    dialog = TestBed.inject(MatDialog);
  });

  afterAll(() => consoleSpy.mockRestore());

  it('should open the dialogs when functions are called', () => {
    const openDialogSpy = jest.spyOn(dialog, 'open');

    jest.spyOn(service, 'getCurrentUser').mockReturnValue({
      status: LoadingStatus.SUCCESS,
      data: mockPerson,
    } as any);

    const mockResponse: ReadRequestResource = prescriptionResponse(referralTask, [mockPerformerTask]);

    const prescriptionTaskPatient = {
      prescription: mockResponse,
      performerTask: mockPerformerTask,
      patient: mockPerson,
    };

    const prescriptionTaskExecutionDate = {
      prescription: mockResponse,
      performerTask: mockPerformerTask,
      startExecutionDate: mockPerformerTask.executionPeriod?.start,
    };

    const prescriptionFinishTask = {
      prescription: mockResponse,
      performerTask: mockPerformerTask,
      startExecutionDate: mockPerformerTask.executionPeriod?.start,
      connectedUser: mockPerson,
    };

    const prescriptionTaskCaregiver = {
      prescriptionId: mockResponse.id,
      referralTaskId: referralTask.id,
      assignedCareGivers: [mockPerformerTask.careGiverSsin],
    };

    // openTransferAssignationDialog
    service.openTransferAssignationDialog(ERROR_PRESCRIPTION_DETAILS, mockResponse, mockPerformerTask);

    const paramsTransfer = {
      data: {
        ...prescriptionTaskCaregiver,
        performerTaskId: mockPerformerTask.id,
        intent: mockResponse.intent,
        category: mockResponse.category,
        mode: 'transfer',
      },
      panelClass: ['mh-dialog-container', 'mh-assign-dialog'],
      maxHeight: '90vh',
      maxWidth: '90vw',
      width: '900px',
    };

    expect(openDialogSpy).toHaveBeenCalledTimes(1);
    expect(openDialogSpy).toHaveBeenCalledWith(AssignOrTransferDialog, paramsTransfer);

    //openStartExecutionDialog
    service.openStartExecutionDialog(ERROR_PRESCRIPTION_DETAILS, mockResponse);

    const paramsStartExecution = {
      data: {
        prescription: mockResponse,
        performerTask: undefined,
        startExecutionDate: undefined,
      },
      panelClass: 'mh-dialog-container',
    };

    expect(openDialogSpy).toHaveBeenCalledTimes(2);
    expect(openDialogSpy).toHaveBeenCalledWith(StartExecutionPrescriptionDialog, paramsStartExecution);

    //openStartExecutionDialog with task
    service.openStartExecutionDialog(ERROR_PRESCRIPTION_DETAILS, mockResponse, mockPerformerTask);

    const paramsStartExecutionWithTask = {
      data: prescriptionTaskExecutionDate,
      panelClass: 'mh-dialog-container',
    };

    expect(openDialogSpy).toHaveBeenCalledTimes(3);
    expect(openDialogSpy).toHaveBeenCalledWith(StartExecutionPrescriptionDialog, paramsStartExecutionWithTask);

    // openRestartExecutionDialog
    service.openRestartExecutionDialog(ERROR_PRESCRIPTION_DETAILS, mockResponse, mockPerformerTask, mockPerson);

    const paramsRestartExecution = {
      data: prescriptionTaskPatient,
      panelClass: 'mh-dialog-container',
    };

    expect(openDialogSpy).toHaveBeenCalledTimes(4);
    expect(openDialogSpy).toHaveBeenCalledWith(RestartExecutionPrescriptionDialog, paramsRestartExecution);

    // openFinishExecutionDialog
    service.openFinishExecutionDialog(ERROR_PRESCRIPTION_DETAILS, mockResponse, mockPerformerTask);

    const paramsFinishExecution = {
      data: prescriptionFinishTask,
      panelClass: 'mh-dialog-container',
      minWidth: 'fit-content',
    };

    expect(openDialogSpy).toHaveBeenCalledTimes(5);
    expect(openDialogSpy).toHaveBeenCalledWith(FinishExecutionPrescriptionDialog, paramsFinishExecution);

    // openCancelExecutionDialog
    service.openCancelExecutionDialog(ERROR_PRESCRIPTION_DETAILS, mockResponse, mockPerformerTask, mockPerson);

    const paramsCancelExecution = {
      data: prescriptionTaskPatient,
      panelClass: 'mh-dialog-container',
    };

    expect(openDialogSpy).toHaveBeenCalledTimes(6);
    expect(openDialogSpy).toHaveBeenCalledWith(CancelExecutionPrescriptionDialog, paramsCancelExecution);

    // openInterruptExecutionDialog
    service.openInterruptExecutionDialog(ERROR_PRESCRIPTION_DETAILS, mockResponse, mockPerformerTask, mockPerson);

    const paramsInterruptExecution = {
      data: prescriptionTaskPatient,
      panelClass: 'mh-dialog-container',
    };

    expect(openDialogSpy).toHaveBeenCalledTimes(7);
    expect(openDialogSpy).toHaveBeenCalledWith(InterruptExecutionPrescriptionDialog, paramsInterruptExecution);
  });
  describe('openRejectAssignationDialog', () => {
    const task = {} as RequestTaskResource;
    const patient = {} as PersonResource;

    it('should open the dialog with correct config', () => {
      mockDialogRef.beforeClosed.mockReturnValue(of(undefined));

      service.openRejectAssignationDialog(ERROR_PRESCRIPTION_DETAILS, prescription, task, patient);

      expect(mockDialog.open).toHaveBeenCalledWith(RejectAssignationDialog, {
        data: {
          prescription,
          requestTask: task,
          patient,
        },
        panelClass: 'mh-dialog-container',
      });
    });

    it('should generate a new UUID when beforeClosed emits true', () => {
      mockDialogRef.beforeClosed.mockReturnValue(of(true));
      const setSpy = jest.fn();
      (service as any).generatedUUID = { set: setSpy } as any;

      service.openRejectAssignationDialog(ERROR_PRESCRIPTION_DETAILS, prescription, task, patient);

      expect(setSpy).toHaveBeenCalledWith(expect.any(String));
      expect(setSpy.mock.calls[0][0]).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    });

    it('should NOT generate a new UUID when beforeClosed emits undefined', () => {
      mockDialogRef.beforeClosed.mockReturnValue(of(undefined));
      const setSpy = jest.fn();
      (service as any).generatedUUID = { set: setSpy } as any;

      service.openRejectAssignationDialog(ERROR_PRESCRIPTION_DETAILS, prescription, task, patient);

      expect(setSpy).not.toHaveBeenCalled();
    });
  });

  describe('getPatient', () => {
    it('should return connected user informations when user is patient', () => {
      const patientSpy = jest.spyOn(mockPatientState, 'state');
      const identifySpy = jest.spyOn(mockIdentifyState, 'state');

      patientState.set({
        data: mockPerson,
        status: LoadingStatus.SUCCESS,
      });

      identifyState.set({
        data: '85011300242',
        status: LoadingStatus.SUCCESS,
      });

      const result = service.getPatient();

      expect(patientSpy).toHaveBeenCalled();
      expect(identifySpy).toHaveBeenCalled();
      expect(result.data?.ssin).toBe('85011300242');
      expect(result.status).toBe(LoadingStatus.SUCCESS);
    });

    it('should return patient informations with SSIN when user is a professional', () => {
      const patientSpy = jest.spyOn(mockPatientState, 'state');
      const identifySpy = jest.spyOn(mockIdentifyState, 'state');

      mockAuthService.isProfessional.mockReturnValue(of(true));
      patientState.set({
        data: mockPerson,
        status: LoadingStatus.SUCCESS,
      });

      identifyState.set({
        data: '85011300242',
        status: LoadingStatus.SUCCESS,
      });

      const result = service.getPatient();

      expect(patientSpy).toHaveBeenCalled();
      expect(identifySpy).toHaveBeenCalled();
      expect(result.data?.ssin).toBe('85011300242');
      expect(result.status).toBe(LoadingStatus.SUCCESS);
    });
  });

  it('should return LOADING when crypto key is missing', () => {
    prescriptionState.set({
      data: prescription,
      status: LoadingStatus.SUCCESS,
    });

    encryptionState.set({
      data: undefined,
      status: LoadingStatus.SUCCESS,
    });

    mockTemplateVersionsState.getState?.mockReturnValue(
      signal({
        data: { version: 'READ_BLEEDING', templateId: 1 },
        status: LoadingStatus.SUCCESS,
      })
    );

    const result = service.getPrescription();

    // no intent
    expect(result.status).toBe(LoadingStatus.INITIAL);

    service.intent.set(Intent.ORDER);
    const result2 = service.getPrescription();
    expect(result2.status).toBe(LoadingStatus.LOADING);
    expect(result2.data).toBe(prescription);
  });

  it('should return SUCCESS when everything is ready', () => {
    prescriptionState.set({
      data: prescription,
      status: LoadingStatus.SUCCESS,
    });

    encryptionState.set({
      data: { key: 'crypto-key' } as unknown as CryptoKey,
      status: LoadingStatus.SUCCESS,
    });

    mockTemplateVersionsState.getState?.mockReturnValue(
      signal({
        data: { version: 'BLEEDING', templateId: 1 },
        status: LoadingStatus.SUCCESS,
      })
    );

    const result_no_intent = service.getPrescription();
    // no intent
    expect(result_no_intent.status).toBe(LoadingStatus.INITIAL);

    service.intent.set(Intent.ORDER);

    const result = service.getPrescription();

    expect(result.status).toBe(LoadingStatus.SUCCESS);
  });

  describe('getDecryptedResponses', () => {
    it('should return ERROR when pseudonymized key is missing', () => {
      const prescription = {
        ...prescriptionResponse(null, [mockPerformerTask]),
        pseudonymizedKey: null as any,
      } as Partial<ReadRequestResource>;

      const prescriptionDefaultState = {
        data: prescription,
        status: LoadingStatus.SUCCESS,
      };
      prescriptionState.set(prescriptionDefaultState);

      mockTemplateVersionsState.getState?.mockReturnValue(
        signal({
          data: mockTemplate,
          status: LoadingStatus.SUCCESS,
        })
      );

      const result_no_intent = service.getDecryptedResponses();
      // no intent
      expect(result_no_intent.status).toBe(LoadingStatus.INITIAL);

      service.intent.set(Intent.ORDER);

      const result = service.getDecryptedResponses();
      expect(result.status).toBe(LoadingStatus.ERROR);
      expect(result.error).toEqual({ decryptedResponses: 'Pseudonymized key missing' });
    });
    it('should split recommendations from the main data for ANNEX_82 templates', () => {
      prescriptionState.set({
        data: { ...prescriptionResponse(null, [mockPerformerTask]), templateCode: TemplateCodes.ANNEX_82 },
        status: LoadingStatus.SUCCESS,
      });

      service.decryptedResponses$.set({
        data: { foo: 'bar', recommendations: ['rec1'], selectedRecommendation: 'rec1' },
      });

      service.intent.set(Intent.ORDER);

      const mainResult = service.getDecryptedResponses('main');
      expect(mainResult.status).toBe(LoadingStatus.SUCCESS);
      expect(mainResult.data).toEqual({ foo: 'bar' });

      const secondaryResult = service.getDecryptedResponses('secondary');
      expect(secondaryResult.status).toBe(LoadingStatus.SUCCESS);
      expect(secondaryResult.data).toEqual({ recommendations: ['rec1'], selectedRecommendation: 'rec1' });
    });
    it('should return SUCCESS with the full data for non ANNEX_82 templates', () => {
      prescriptionState.set({
        data: prescriptionResponse(null, [mockPerformerTask]),
        status: LoadingStatus.SUCCESS,
      });

      service.decryptedResponses$.set({ data: { foo: 'bar' } });

      service.intent.set(Intent.ORDER);

      const result = service.getDecryptedResponses();
      expect(result.status).toBe(LoadingStatus.SUCCESS);
      expect(result.data).toEqual({ foo: 'bar' });
    });
    it('should return undefined when both recommendations and selectedRecommendation are missing', () => {
      service.intent.set(Intent.PROPOSAL);

      proposalState.set({
        data: { ...prescriptionResponse(null, [mockPerformerTask]), templateCode: TemplateCodes.ANNEX_81 },
        status: LoadingStatus.SUCCESS,
      });

      service.decryptedResponses$.set({
        data: {},
      });

      const result = service.getDecryptedResponses('secondary');
      expect(result.status).toBe(LoadingStatus.SUCCESS);
      expect(result.data).toBeUndefined();
    });

    test.each([
      { recommendations: ['rec1'], selectedRecommendation: undefined },
      { recommendations: undefined, selectedRecommendation: 'rec1' },
      { recommendations: ['rec1'], selectedRecommendation: 'rec1' },
    ])(
      'should return SUCCESS with the correct data when recommendations and/or selectedRecommendation are present',
      ({ recommendations, selectedRecommendation }) => {
        service.intent.set(Intent.PROPOSAL);

        proposalState.set({
          data: { ...prescriptionResponse(null, [mockPerformerTask]), templateCode: TemplateCodes.ANNEX_82 },
          status: LoadingStatus.SUCCESS,
        });

        service.decryptedResponses$.set({
          data: { recommendations, selectedRecommendation },
        });

        const result = service.getDecryptedResponses('secondary');
        expect(result.status).toBe(LoadingStatus.SUCCESS);
        expect(result.data).toEqual({ recommendations, selectedRecommendation });
      }
    );
  });

  it('should find performer task by currentTask.taskId', () => {
    const performerTaskWithMatchingSsin = {
      ...mockPerformerTask,
      id: 'task-to-find',
      careGiverSsin: mockPerson.ssin,
    };

    const prescription = prescriptionResponse(null, [performerTaskWithMatchingSsin]);
    prescription.currentTask = {
      taskId: 'task-to-find',
      taskType: 'PerformerTaskResource',
      allowedActions: {},
    };

    prescriptionState.set({
      data: prescription,
      status: LoadingStatus.SUCCESS,
    });

    const result_no_intent = service.getRequestTask();
    // no intent
    expect(result_no_intent.status).toBe(LoadingStatus.INITIAL);

    service.intent.set(Intent.ORDER);

    const result = service.getRequestTask();
    expect(result.status).toBe(LoadingStatus.SUCCESS);
    expect(result.data).toEqual(performerTaskWithMatchingSsin);
  });

  it('should emit proposalApproved when dialog is closed with prescriptionId', () => {
    const proposal = prescriptionResponse(null, [mockPerformerTask]) as unknown as ReadRequestResource;
    const prescriptionId = 'test-prescription-id';

    const dialogRefMock = {
      beforeClosed: jest.fn().mockReturnValue(of({ prescriptionId: prescriptionId })),
    };

    const openSpy = jest.spyOn(dialog!, 'open').mockReturnValue(dialogRefMock as any);
    const emitSpy = jest.spyOn(service.proposalApproved, 'next');

    service.openApproveProposalDialog(ERROR_PRESCRIPTION_DETAILS, proposal);

    expect(openSpy).toHaveBeenCalledWith(ApproveProposalDialog, {
      data: { proposal: proposal },
      panelClass: 'mh-dialog-container',
    });

    expect(emitSpy).toHaveBeenCalledWith({ prescriptionId: prescriptionId });
  });

  describe('openRejectProposalDialog', () => {
    it('should open the RejectProposalDialog with correct data and trigger alert on close', () => {
      const mockProposal = { id: 'proposal-123' } as any;
      const dialogRefMock = {
        beforeClosed: jest.fn().mockReturnValue(of(true)), // Emulate closing the dialog
      };

      const dialogOpenSpy = jest.spyOn(dialog, 'open').mockReturnValue(dialogRefMock as any);

      service.openRejectProposalDialog(ERROR_PRESCRIPTION_DETAILS, mockProposal);

      expect(dialogOpenSpy).toHaveBeenCalledWith(RejectProposalDialog, {
        data: { proposal: mockProposal },
        panelClass: 'mh-dialog-container',
      });
    });
  });

  describe('openFinishExecutionDialog', () => {
    it('should reload prescription when reload is set to true', () => {
      const spyLoadPrescription = jest.spyOn(mockPrescriptionState, 'loadPrescription');
      const mockResponse: ReadRequestResource = prescriptionResponse(referralTask, [mockPerformerTask]);

      const mockDialogRef = {
        beforeClosed: jest.fn().mockReturnValue(of({ reload: true })),
      } as Partial<MatDialogRef<unknown>>;

      mockDialog.open.mockReturnValue(mockDialogRef as MatDialogRef<FinishExecutionPrescriptionDialog>);

      service.openFinishExecutionDialog(ERROR_PRESCRIPTION_DETAILS, mockResponse, mockPerformerTask);
      expect(spyLoadPrescription).toHaveBeenCalledTimes(1);
    });
  });

  describe('onSelfAssign', () => {
    it('should show error when onSelfAssign validation fails', () => {
      const prescriptionSpy = jest.spyOn(mockPrescriptionState, 'assignPrescriptionPerformer');
      const toastSpy = jest.spyOn(mockToastService, 'showSomethingWentWrong');

      const validUser = UserNurse;

      const invalidCases = [
        {
          prescription: { referralTask: { id: 'referral-task-id' }, intent: Intent.ORDER } as ReadRequestResource,
          user: validUser,
        },
        { prescription: { id: 'prescription-id', intent: Intent.ORDER } as ReadRequestResource, user: validUser },
        {
          prescription: {
            id: 'prescription-id',
            referralTask: { id: 'referral-task-id' },
            intent: Intent.ORDER,
          } as ReadRequestResource,
          user: undefined,
        },
        {
          prescription: {
            id: 'prescription-id',
            referralTask: { id: 'referral-task-id' },
            intent: Intent.ORDER,
          } as ReadRequestResource,
          user: {},
        },
      ];

      invalidCases.forEach(({ prescription, user }) => {
        service.onSelfAssign(prescription, user);
      });

      expect(toastSpy).toHaveBeenCalledTimes(4);
      expect(prescriptionSpy).not.toHaveBeenCalled();
    });

    it('should assign prescription successfully and show success toast', () => {
      const generatedUUIDSetSpy = jest.spyOn(service.generatedUUID, 'set');
      const prescription = {
        id: 'prescription-id',
        referralTask: { id: 'referral-task-id' },
        intent: Intent.ORDER,
      } as ReadRequestResource;
      const user = UserNurse;
      mockPrescriptionState.assignPrescriptionPerformer?.mockReturnValue(of({ id: 'task-1' }));

      service.generatedUUID.set('mocked-uuid');

      service.onSelfAssign(prescription, user);

      expect(mockPrescriptionState.assignPrescriptionPerformer).toHaveBeenCalledWith(
        'prescription-id',
        'referral-task-id',
        'user-ssin',
        'NURSE',
        'PROFESSIONAL',
        'mocked-uuid',
        undefined,
        undefined
      );

      expect(generatedUUIDSetSpy).toHaveBeenCalledWith('mocked-uuid');
      expect(mockToastService.show).toHaveBeenCalledWith('prescription.assignPerformer.meSuccess');
      expect(service.loading()).toBe(false);
    });

    it('should assign proposal successfully and show success toast', () => {
      const generatedUUIDSetSpy = jest.spyOn(service.generatedUUID, 'set');
      const prescription = {
        id: 'prescription-id',
        referralTask: { id: 'referral-task-id' },
        intent: Intent.PROPOSAL,
      } as ReadRequestResource;
      const user = UserNurse;
      mockProposalState.assignProposalPerformer?.mockReturnValue(of({ id: 'task-1' }));

      service.generatedUUID.set('mocked-uuid');
      service.onSelfAssign(prescription, user);

      expect(mockProposalState.assignProposalPerformer).toHaveBeenCalledWith(
        'prescription-id',
        'referral-task-id',
        'user-ssin',
        'NURSE',
        'PROFESSIONAL',
        'mocked-uuid'
      );
      expect(generatedUUIDSetSpy).toHaveBeenCalledWith('mocked-uuid');
      expect(mockToastService.show).toHaveBeenCalledWith('proposal.assignPerformer.meSuccess');
    });
    it('should handle assignment error and show error toast', () => {
      const generatedUUIDSetSpy = jest.spyOn(service.generatedUUID, 'set');

      const prescription = {
        id: 'prescription-id',
        referralTask: { id: 'referral-task-id' },
        intent: Intent.ORDER,
      } as ReadRequestResource;
      const user = UserNurse;
      mockPrescriptionState.assignPrescriptionPerformer?.mockReturnValue(throwError(() => new Error('API Error')));

      service.generatedUUID.set('mocked-uuid');
      service.onSelfAssign(prescription, user);

      expect(generatedUUIDSetSpy).toHaveBeenCalledWith('mocked-uuid');
      expect(mockToastService.showSomethingWentWrong).toHaveBeenCalled();
      expect(service.loading()).toBe(false);
    });

    it('should assign with internal assignation type when organization is acting for a professional', () => {
      (service as any)._isOrganizationAndActingForProfessional = signal(true);

      const prescription: ReadRequestResource = {
        id: 'prescription-id',
        referralTask: { id: 'referral-task-id' },
        intent: Intent.ORDER,
      };
      const user = UserNurse;

      mockPrescriptionState.assignPrescriptionPerformer?.mockReturnValue(of({ id: 'task-1' }));

      service.generatedUUID.set('mocked-uuid');
      service.onSelfAssign(prescription, user);

      expect(mockPrescriptionState.assignPrescriptionPerformer).toHaveBeenCalledWith(
        'prescription-id',
        'referral-task-id',
        'user-ssin',
        'NURSE',
        'PROFESSIONAL',
        'mocked-uuid',
        AssignationType.Internal,
        'mock-nihii'
      );
    });

    it('should assign with organization when organization is acting for a professional, but the template is an Annex_82', () => {
      (service as any)._isOrganizationAndActingForProfessional = signal(true);

      const prescription: ReadRequestResource = {
        id: 'prescription-id',
        referralTask: { id: 'referral-task-id' },
        intent: Intent.ORDER,
        templateCode: TemplateCodes.ANNEX_82,
      };
      const user = { organizations: [{ hospital: { nihii: 'mock-nihii' } }] };

      mockPrescriptionState.assignPrescriptionPerformer?.mockReturnValue(of({ id: 'task-1' }));

      service.generatedUUID.set('mocked-uuid');
      service.onSelfAssign(prescription, user);

      expect(mockPrescriptionState.assignPrescriptionPerformer).toHaveBeenCalledWith(
        'prescription-id',
        'referral-task-id',
        'mock-nihii',
        '',
        'hospital',
        'mocked-uuid',
        undefined,
        undefined
      );
    });

    it('should extract organization details when currentUser has organizations and is not acting for professional', () => {
      const prescription: ReadRequestResource = {
        id: 'prescription-id',
        referralTask: { id: 'referral-task-id' },
        intent: Intent.ORDER,
      };

      const user: Partial<UserInfo> = {
        organizations: [{ hospital: { nihii: '12345678910' } }],
      };

      mockPrescriptionState.assignPrescriptionPerformer?.mockReturnValue(of({ id: 'task-1' }));

      service.generatedUUID.set('mocked-uuid');
      service.onSelfAssign(prescription, user);

      expect(mockPrescriptionState.assignPrescriptionPerformer).toHaveBeenCalledWith(
        'prescription-id',
        'referral-task-id',
        '12345678910',
        '',
        'hospital',
        'mocked-uuid',
        undefined,
        undefined
      );
    });

    it('should stop loading and show error if ssinOrNihii resolves to empty after checking organizations', () => {
      const prescription: ReadRequestResource = {
        id: 'prescription-id',
        referralTask: { id: 'referral-task-id' },
        intent: Intent.ORDER,
      };

      const user: Partial<UserInfo> = {
        organizations: [{ hospital: { nihii: '' } }], // Missing NIHII
      };

      service.onSelfAssign(prescription, user);

      expect(service.loading()).toBe(false);
      expect(mockToastService.showSomethingWentWrong).toHaveBeenCalled();
      expect(mockPrescriptionState.assignPrescriptionPerformer).not.toHaveBeenCalled();
    });
  });

  function createStateSignal<TData, TError = unknown, TParams = Params>() {
    return signal<DataState<TData, TError, TParams>>({
      data: undefined,
      status: LoadingStatus.INITIAL,
    });
  }
});
