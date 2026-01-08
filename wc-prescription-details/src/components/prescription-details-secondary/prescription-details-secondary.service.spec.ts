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
  FakeLoader,
} from '../../../test.utils';
import { PrescriptionDetailsSecondaryService } from './prescription-details-secondary.service';
import { ConfigurationService } from '@reuse/code/services/config/configuration.service';
import { AuthService } from '@reuse/code/services/auth/auth.service';
import { PseudonymisationHelper } from '@smals-belgium-shared/pseudo-helper';
import { PersonService } from '@reuse/code/services/api/person.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';

describe('PrescriptionDetailsSecondaryService', () => {
  let service: PrescriptionDetailsSecondaryService;
  let dialog: MatDialog;
  let consoleSpy: jest.SpyInstance;

  beforeAll(() => {
    consoleSpy = jest.spyOn(global.console, 'error').mockImplementation(message => {
      if (!message?.message?.includes('Could not parse CSS stylesheet')) {
        global.console.warn(message);
      }
    });
  });

  beforeEach(() => {
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
});
