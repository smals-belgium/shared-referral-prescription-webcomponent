import { TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ProposalService, ReadRequestResource } from '@reuse/code/openapi';
import { TransferAssignationDialog } from '@reuse/code/dialogs/transfer-assignation/transfer-assignation.dialog';
import { StartExecutionPrescriptionDialog } from '@reuse/code/dialogs/start-execution-prescription/start-execution-prescription.dialog';
import { RestartExecutionPrescriptionDialog } from '@reuse/code/dialogs/restart-execution-prescription/restart-execution-prescription.dialog';
import { FinishExecutionPrescriptionDialog } from '@reuse/code/dialogs/finish-execution-prescription/finish-execution-prescription.dialog';
import { CancelExecutionPrescriptionDialog } from '@reuse/code/dialogs/cancel-execution-prescription/cancel-execution-prescription.dialog';
import { InterruptExecutionPrescriptionDialog } from '@reuse/code/dialogs/interrupt-execution-prescription/interrupt-execution-prescription.dialog';
import { RejectAssignationDialog } from '@reuse/code/dialogs/reject-assignation/reject-assignation.dialog';
import {
  prescriptionResponse,
  organisationTask,
  referralTask,
  mockPerformerTask,
  mockPerson,
  mockConfigService,
  mockAuthService,
  MockPseudoHelperFactory,
  mockPersonService,
  FakeLoader, mockTemplate,
} from '../../../test.utils';
import { PrescriptionDetailsSecondaryService } from './prescription-details-secondary.service';
import { ConfigurationService } from '@reuse/code/services/config/configuration.service';
import { AuthService } from '@reuse/code/services/auth/auth.service';
import { PseudonymisationHelper } from '@smals-belgium-shared/pseudo-helper';
import { PersonService } from '@reuse/code/services/api/person.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { LoadingStatus } from '@reuse/code/interfaces';
import { IdentifyState } from '@reuse/code/states/privacy/identify.state';
import { PatientState } from '@reuse/code/states/api/patient.state';
import { of } from 'rxjs';
import { PrescriptionState } from '@reuse/code/states/api/prescription.state';
import { TemplateVersionsState } from '@reuse/code/states/api/template-versions.state';
import { TemplatesState } from '@reuse/code/states/api/templates.state';
import { ApproveProposalDialog } from '@reuse/code/dialogs/approve-proposal/approve-proposal.dialog';
import { EncryptionState } from '@reuse/code/states/privacy/encryption.state';

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

  const prescription = prescriptionResponse(null, null, [mockPerformerTask]) as unknown as ReadRequestResource;

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
    mockPrescriptionState = { state: jest.fn() } as any;
    mockTemplateVersionsState = { state: jest.fn(), getState: jest.fn() } as any;
    mockTemplatesState = { state: jest.fn() } as any;

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
        ProposalService,
        MatDialog,
        { provide: PseudonymisationHelper, useValue: MockPseudoHelperFactory() },
        { provide: ConfigurationService, useValue: mockConfigService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: IdentifyState, useValue: mockIdentifyState },
        { provide: PatientState, useValue: mockPatientState },
        { provide: EncryptionState, useValue: mockEncryptionState },
        { provide: PrescriptionState, useValue: mockPrescriptionState },
        { provide: TemplateVersionsState, useValue: mockTemplateVersionsState },
        { provide: TemplatesState, useValue: mockTemplatesState },
      ],
    });

    service = TestBed.inject(PrescriptionDetailsSecondaryService);
    dialog = TestBed.inject(MatDialog);
  });

  afterAll(() => consoleSpy.mockRestore());

  it('should open the dialogs when functions are called', () => {
    const openDialogSpy = jest.spyOn(dialog, 'open');

    const mockResponse = prescriptionResponse([organisationTask], referralTask, [
      mockPerformerTask,
    ]) as unknown as ReadRequestResource;

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

    const prescriptionTaskCaregiver = {
      prescriptionId: mockResponse.id,
      referralTaskId: referralTask.id,
      assignedCareGivers: [mockPerformerTask.careGiverSsin],
    };

    // openTransferAssignationDialog
    service.openTransferAssignationDialog(mockResponse, mockPerformerTask);

    const paramsTransfer = {
      data: {
        ...prescriptionTaskCaregiver,
        performerTaskId: mockPerformerTask.id,
        intent: mockResponse.intent,
        category: mockResponse.category,
      },
      panelClass: 'mh-dialog-container',
      maxHeight: '90vh',
    };

    expect(openDialogSpy).toHaveBeenCalledTimes(1);
    expect(openDialogSpy).toHaveBeenCalledWith(TransferAssignationDialog, paramsTransfer);

    //openStartExecutionDialog
    service.openStartExecutionDialog(mockResponse);

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
    service.openStartExecutionDialog(mockResponse, mockPerformerTask);

    const paramsStartExecutionWithTask = {
      data: prescriptionTaskExecutionDate,
      panelClass: 'mh-dialog-container',
    };

    expect(openDialogSpy).toHaveBeenCalledTimes(3);
    expect(openDialogSpy).toHaveBeenCalledWith(StartExecutionPrescriptionDialog, paramsStartExecutionWithTask);

    // openRestartExecutionDialog
    service.openRestartExecutionDialog(mockResponse, mockPerformerTask, mockPerson);

    const paramsRestartExecution = {
      data: prescriptionTaskPatient,
      panelClass: 'mh-dialog-container',
    };

    expect(openDialogSpy).toHaveBeenCalledTimes(4);
    expect(openDialogSpy).toHaveBeenCalledWith(RestartExecutionPrescriptionDialog, paramsRestartExecution);

    // openFinishExecutionDialog
    service.openFinishExecutionDialog(mockResponse, mockPerformerTask);

    const paramsFinishExecution = {
      data: prescriptionTaskExecutionDate,
      panelClass: 'mh-dialog-container',
    };

    expect(openDialogSpy).toHaveBeenCalledTimes(5);
    expect(openDialogSpy).toHaveBeenCalledWith(FinishExecutionPrescriptionDialog, paramsFinishExecution);

    // openCancelExecutionDialog
    service.openCancelExecutionDialog(mockResponse, mockPerformerTask, mockPerson);

    const paramsCancelExecution = {
      data: prescriptionTaskPatient,
      panelClass: 'mh-dialog-container',
    };

    expect(openDialogSpy).toHaveBeenCalledTimes(6);
    expect(openDialogSpy).toHaveBeenCalledWith(CancelExecutionPrescriptionDialog, paramsCancelExecution);

    // openInterruptExecutionDialog
    service.openInterruptExecutionDialog(mockResponse, mockPerformerTask, mockPerson);

    const paramsInterruptExecution = {
      data: prescriptionTaskPatient,
      panelClass: 'mh-dialog-container',
    };

    expect(openDialogSpy).toHaveBeenCalledTimes(7);
    expect(openDialogSpy).toHaveBeenCalledWith(InterruptExecutionPrescriptionDialog, paramsInterruptExecution);

    // openRejectAssignationDialog
    service.openRejectAssignationDialog(mockResponse, mockPerformerTask, mockPerson);

    const paramsRejectExecution = {
      data: prescriptionTaskPatient,
      panelClass: 'mh-dialog-container',
    };

    expect(openDialogSpy).toHaveBeenCalledTimes(8);
    expect(openDialogSpy).toHaveBeenCalledWith(RejectAssignationDialog, paramsRejectExecution);
  });

  it('should return patient with SSIN when user is patient', () => {
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

    expect(result.status).toBe(LoadingStatus.LOADING);
    expect(result.data).toBe(prescription);
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

    const result = service.getPrescription();

    expect(result.status).toBe(LoadingStatus.SUCCESS);
  });

  it('should return ERROR when pseudonymized key is missing', () => {
    const prescription = {
      ...prescriptionResponse(null, null, [mockPerformerTask]),
      pseudonymizedKey : null,
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

    const result = service.getDecryptedResponses();

    expect(result.status).toBe(LoadingStatus.ERROR);
    expect(result.error).toEqual({ decryptedResponses: 'Pseudonymized key missing' });
  });

  it('should find performer task in direct performerTasks', () => {
    const performerTaskWithMatchingSsin = {
      ...mockPerformerTask,
      careGiverSsin: mockPerson.ssin,
    };

    const prescription = prescriptionResponse(null, null, [performerTaskWithMatchingSsin]);

    mockPrescriptionState.state.mockReturnValue({
      data: prescription,
      status: LoadingStatus.SUCCESS,
    });

    const result = service.getPerformerTask();

    expect(result.status).toBe(LoadingStatus.SUCCESS);
    expect(result.data).toEqual(performerTaskWithMatchingSsin);
  });

  it('should emit proposalApproved when dialog is closed with prescriptionId', () => {
    const proposal = prescriptionResponse(null, null, [mockPerformerTask]) as unknown as ReadRequestResource;
    const prescriptionId = 'test-prescription-id';

    const dialogRefMock = {
      beforeClosed: jest.fn().mockReturnValue(
        of({ prescriptionId: prescriptionId })
      ),
    };

    const openSpy = jest.spyOn(dialog!, 'open').mockReturnValue(dialogRefMock as any);
    const emitSpy = jest.spyOn(service.proposalApproved, 'next');

    service.openApproveProposalDialog(proposal);

    expect(openSpy).toHaveBeenCalledWith(
      ApproveProposalDialog,
      {
        data: { proposal: proposal },
        panelClass: 'mh-dialog-container',
      }
    );

    expect(emitSpy).toHaveBeenCalledWith({ prescriptionId: prescriptionId });
  });

});
