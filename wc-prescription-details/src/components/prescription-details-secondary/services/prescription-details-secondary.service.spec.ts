import { TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { PersonResource, ReadRequestResource, RequestTaskResource } from '@reuse/code/openapi';
import { StartExecutionPrescriptionDialog } from '@reuse/code/dialogs/start-execution-prescription/start-execution-prescription.dialog';
import { RestartExecutionPrescriptionDialog } from '@reuse/code/dialogs/restart-execution-prescription/restart-execution-prescription.dialog';
import { FinishExecutionPrescriptionDialog } from '@reuse/code/dialogs/finish-execution-prescription/finish-execution-prescription.dialog';
import { CancelExecutionPrescriptionDialog } from '@reuse/code/dialogs/cancel-execution-prescription/cancel-execution-prescription.dialog';
import { InterruptExecutionPrescriptionDialog } from '@reuse/code/dialogs/interrupt-execution-prescription/interrupt-execution-prescription.dialog';
import { RejectAssignationDialog } from '@reuse/code/dialogs/reject-assignation/reject-assignation.dialog';
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
import { ConfigurationService } from '@reuse/code/services/config/configuration.service';
import { AuthService } from '@reuse/code/services/auth/auth.service';
import { PseudonymisationHelper } from '@smals-belgium-shared/pseudo-helper';
import { PersonService } from '@reuse/code/services/api/person.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { Intent, LoadingStatus } from '@reuse/code/interfaces';
import { IdentifyState } from '@reuse/code/states/privacy/identify.state';
import { PatientState } from '@reuse/code/states/api/patient.state';
import { of } from 'rxjs';
import { PrescriptionState } from '@reuse/code/states/api/prescription.state';
import { TemplateVersionsState } from '@reuse/code/states/api/template-versions.state';
import { TemplatesState } from '@reuse/code/states/api/templates.state';
import { ApproveProposalDialog } from '@reuse/code/dialogs/approve-proposal/approve-proposal.dialog';
import { EncryptionState } from '@reuse/code/states/privacy/encryption.state';
import { AssignOrTransferDialog } from '@reuse/code/dialogs/assign-or-transfer-dialog/assign-or-transfer-dialog';
import { RejectProposalDialog } from '@reuse/code/dialogs/reject-proposal/reject-proposal.dialog';
import { ERROR_PRESCRIPTION_DETAILS } from '@reuse/code/constants/error';
import { ProposalState } from '@reuse/code/states/api/proposal.state';

jest.mock('@reuse/code/utils/idToken.utils', () => ({
  ...jest.requireActual('@reuse/code/utils/idToken.utils'),
  getConnectedOrganizationNihii: jest.fn(),
}));

describe('PrescriptionDetailsSecondaryService', () => {
  let service: PrescriptionDetailsSecondaryService;
  let dialog: MatDialog;
  let consoleSpy: jest.SpyInstance;
  let mockIdentifyState: any;
  let mockPatientState: any;
  let mockEncryptionState: any;
  let mockPrescriptionState: any;
  let mockTemplateVersionsState: any;
  let mockTemplatesState: any;
  let mockDialogRef: { beforeClosed: jest.Mock };
  let mockDialog: jest.Mocked<MatDialog>;
  let mockProposalState: any;

  const prescription = prescriptionResponse(null, [mockPerformerTask]) as unknown as ReadRequestResource;

  beforeAll(() => {
    consoleSpy = jest.spyOn(global.console, 'error').mockImplementation(message => {
      if (!message?.message?.includes('Could not parse CSS stylesheet')) {
        global.console.warn(message);
      }
    });
  });

  beforeEach(() => {
    mockPatientState = { state: jest.fn() } as any;
    mockIdentifyState = { state: jest.fn() } as any;
    mockEncryptionState = { state: jest.fn() } as any;
    mockPrescriptionState = { state: jest.fn(), loadPrescription: jest.fn() } as any;
    mockTemplateVersionsState = { state: jest.fn(), getState: jest.fn() } as any;
    mockTemplatesState = { state: jest.fn() } as any;
    mockProposalState = { state: jest.fn() } as any;

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
      mockPatientState.state.mockReturnValue({
        data: mockPerson,
        status: LoadingStatus.SUCCESS,
      });

      mockIdentifyState.state.mockReturnValue({
        data: '85011300242',
        status: LoadingStatus.SUCCESS,
      });

      const result = service.getPatient();

      expect(mockPatientState.state).toHaveBeenCalled();
      expect(mockIdentifyState.state).toHaveBeenCalled();
      expect(result.data?.ssin).toBe('85011300242');
      expect(result.status).toBe(LoadingStatus.SUCCESS);
    });

    it('should return patient informations with SSIN when user is a professional', () => {
      mockAuthService.isProfessional.mockReturnValue(of(true));
      mockPatientState.state.mockReturnValue({
        data: mockPerson,
        status: LoadingStatus.SUCCESS,
      });

      mockIdentifyState.state.mockReturnValue({
        data: '85011300242',
        status: LoadingStatus.SUCCESS,
      });

      const result = service.getPatient();

      expect(mockPatientState.state).toHaveBeenCalled();
      expect(mockIdentifyState.state).toHaveBeenCalled();
      expect(result.data?.ssin).toBe('85011300242');
      expect(result.status).toBe(LoadingStatus.SUCCESS);
    });
  });

  it('should return LOADING when crypto key is missing', () => {
    mockPrescriptionState.state.mockReturnValue({
      data: prescription,
      status: LoadingStatus.SUCCESS,
    });

    mockEncryptionState.state.mockReturnValue({
      data: undefined,
      status: LoadingStatus.SUCCESS,
    });

    mockTemplateVersionsState.getState.mockReturnValue(() => ({
      data: { code: 'READ_BLEEDING' },
      status: LoadingStatus.SUCCESS,
    }));

    const result = service.getPrescription();

    // no intent
    expect(result.status).toBe(LoadingStatus.INITIAL);

    service.intent.set(Intent.ORDER);
    const result2 = service.getPrescription();
    expect(result2.status).toBe(LoadingStatus.LOADING);
    expect(result2.data).toBe(prescription);
  });

  it('should return SUCCESS when everything is ready', () => {
    mockPrescriptionState.state.mockReturnValue({
      data: prescription,
      status: LoadingStatus.SUCCESS,
    });

    mockEncryptionState.state.mockReturnValue({
      data: { key: 'crypto-key' },
      status: LoadingStatus.SUCCESS,
    });

    mockTemplateVersionsState.getState.mockReturnValue(() => ({
      data: { code: 'BLEEDING' },
      status: LoadingStatus.SUCCESS,
    }));

    const result_no_intent = service.getPrescription();
    // no intent
    expect(result_no_intent.status).toBe(LoadingStatus.INITIAL);

    service.intent.set(Intent.ORDER);

    const result = service.getPrescription();

    expect(result.status).toBe(LoadingStatus.SUCCESS);
  });

  it('should return ERROR when pseudonymized key is missing', () => {
    const prescription = {
      ...prescriptionResponse(null, [mockPerformerTask]),
      pseudonymizedKey: null,
    } as any;

    const prescriptionState = {
      data: prescription,
      status: LoadingStatus.SUCCESS,
    };
    mockPrescriptionState.state.mockReturnValue(prescriptionState);

    mockTemplateVersionsState.getState.mockReturnValue(() => ({
      data: mockTemplate,
      status: LoadingStatus.SUCCESS,
    }));

    const result_no_intent = service.getDecryptedResponses();
    // no intent
    expect(result_no_intent.status).toBe(LoadingStatus.INITIAL);

    service.intent.set(Intent.ORDER);

    const result = service.getDecryptedResponses();
    expect(result.status).toBe(LoadingStatus.ERROR);
    expect(result.error).toEqual({ decryptedResponses: 'Pseudonymized key missing' });
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

    mockPrescriptionState.state.mockReturnValue({
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
});
