import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { signal, WritableSignal } from '@angular/core';
import { PrescriptionDetailsActionsComponent } from './prescription-details-actions.component';
import { PrescriptionsPdfService } from '@reuse/code/services/helpers/prescription-pdf.service';
import { PrescriptionState } from '@reuse/code/states/api/prescription.state';
import { ProposalState } from '@reuse/code/states/api/proposal.state';
import { ToastService } from '@reuse/code/services/helpers/toast.service';
import {
  AccessMatrixService,
  AssignationType,
  AssignCareGiverResource,
  Discipline,
  PersonResource,
  ReadRequestResource,
  RequestTaskResource,
} from '@reuse/code/openapi';
import { DeviceService } from '@reuse/code/services/helpers/device.service';
import { PrescriptionDetailsSecondaryService } from '../../prescription-details-secondary/services/prescription-details-secondary.service';
import { ViewState } from '../../../prescription-details/prescription-details.component';
import { CancelPrescriptionDialog } from '@reuse/code/dialogs/cancel-prescription/cancel-prescription-dialog.component';
import { Intent, UserInfo } from '@reuse/code/interfaces';
import { AssignOrTransferDialog } from '@reuse/code/dialogs/assign-or-transfer-dialog/assign-or-transfer-dialog';
import { Lang } from '@reuse/code/constants/languages';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { AlertService } from '@reuse/code/services/helpers/alert.service';
import { ALERT_TARGET, ERROR_PRESCRIPTION_DETAILS } from '@reuse/code/constants/error';
import { By } from '@angular/platform-browser';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { FakeLoader } from '../../../../test.utils';
import { ConfigurationService } from '@reuse/code/services/config/configuration.service';
import MockInstance = jest.MockInstance;
import TaskTypeEnum = RequestTaskResource.TaskTypeEnum;
import anything = jasmine.anything;

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid'),
}));

const UserNurse: Partial<UserInfo> = { ssin: 'user-ssin', discipline: Discipline.Nurse };
describe('PrescriptionDetailsActionsComponent', () => {
  let component: PrescriptionDetailsActionsComponent;
  let fixture: ComponentFixture<PrescriptionDetailsActionsComponent>;
  let mockPdfService: jest.Mocked<any>;
  let mockDialogRef: { beforeClosed: jest.Mock };
  let mockDialog: jest.Mocked<MatDialog>;
  let mockToastService: jest.Mocked<ToastService>;
  let mockPrescriptionState: jest.Mocked<PrescriptionState>;
  let mockProposalState: jest.Mocked<ProposalState>;
  let mockAlertService: jest.Mocked<AlertService>;
  let accessMatrixServiceMock: jest.Mocked<AccessMatrixService>;
  let mockDeviceService: { isDesktop: WritableSignal<boolean> };
  let mockSecondaryService: jest.Mocked<PrescriptionDetailsSecondaryService>;
  let mockConfigurationService: jest.Mocked<ConfigurationService>;

  const mockLoadingSignal = signal(false);
  const mockGeneratedUUID = signal('test-uuid-123');

  const createMockPrescription = (): ReadRequestResource =>
    ({
      id: 'prescription-1',
      referralTask: { id: 'referral-1' },
      performerTasks: { 'ssin-1': [{ careGiverSsin: 'ssin-1' } as RequestTaskResource] },
      category: 'nursing-care',
      intent: Intent.ORDER,
    }) as ReadRequestResource;

  const createMockPatient = (): PersonResource =>
    ({
      firstName: 'John',
    }) as PersonResource;

  const createMockViewState = (overrides = {}) =>
    ({
      prescription: createMockPrescription(),
      patient: createMockPatient(),
      currentUser: { ssin: 'user-ssin', discipline: 'nursing', role: 'nurse' } as Partial<PersonResource>,
      decryptedResponses: { field1: 'value1' },
      template: { id: 'template-1' },
      templateVersion: { version: '1.0' },
      ...overrides,
    }) as unknown as ViewState;

  beforeEach(async () => {
    mockSecondaryService = {
      getCurrentUser: jest.fn().mockReturnValue({ data: { ssin: 'current-user-ssin' } }),
      getRequestTask: jest
        .fn()
        .mockReturnValue({ data: { id: 'performer-task-1', taskType: TaskTypeEnum.PerformerTaskResource } }),
      getPrescription: jest.fn().mockReturnValue(createMockPrescription()),
      getPatient: jest.fn().mockReturnValue(createMockPatient()),
      loading: mockLoadingSignal as MockInstance<boolean, [], unknown> & WritableSignal<boolean>,
      generatedUUID: mockGeneratedUUID as MockInstance<string, [], unknown> & WritableSignal<string>,
    } as unknown as jest.Mocked<PrescriptionDetailsSecondaryService>;

    mockPdfService = { createCommonPdf: jest.fn() } as unknown as jest.Mocked<PrescriptionsPdfService>;
    mockDialogRef = {
      beforeClosed: jest.fn().mockReturnValue(of(true)),
    };

    mockDialog = {
      open: jest.fn().mockReturnValue(mockDialogRef),
    } as unknown as jest.Mocked<MatDialog>;
    mockToastService = { show: jest.fn(), showSomethingWentWrong: jest.fn() } as unknown as jest.Mocked<ToastService>;
    mockPrescriptionState = {
      assignPrescriptionPerformer: jest.fn(),
      assignMultipleCaregivers: jest.fn(),
    } as unknown as jest.Mocked<PrescriptionState>;
    mockProposalState = {
      assignProposalPerformer: jest.fn(),
    } as unknown as jest.Mocked<ProposalState>;
    mockAlertService = { showGeneralError: jest.fn() } as unknown as jest.Mocked<AlertService>;
    mockConfigurationService = {
      getEnvironmentVariable: jest.fn<unknown, [string]>(),
    } as unknown as jest.Mocked<ConfigurationService>;

    accessMatrixServiceMock = {
      getMatrix: jest.fn(),
    } as unknown as jest.Mocked<AccessMatrixService>;

    mockDeviceService = {
      isDesktop: signal(true),
    };

    await TestBed.configureTestingModule({
      imports: [
        PrescriptionDetailsActionsComponent,
        MatIconTestingModule,
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: FakeLoader },
        }),
      ],
      providers: [
        { provide: DeviceService, useValue: mockDeviceService },
        { provide: PrescriptionDetailsSecondaryService, useValue: mockSecondaryService },
        { provide: PrescriptionsPdfService, useValue: mockPdfService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: ToastService, useValue: mockToastService },
        { provide: PrescriptionState, useValue: mockPrescriptionState },
        { provide: ProposalState, useValue: mockProposalState },
        { provide: AlertService, useValue: mockAlertService },
        { provide: AccessMatrixService, useValue: accessMatrixServiceMock },
        { provide: ALERT_TARGET, useValue: ERROR_PRESCRIPTION_DETAILS },
        { provide: ConfigurationService, useValue: mockConfigurationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PrescriptionDetailsActionsComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockLoadingSignal.set(false);
  });

  it('should create and initialize service data correctly', () => {
    expect(component).toBeTruthy();
    expect(component.currentUserServiceData).toEqual({ ssin: 'current-user-ssin' });
    expect(component.requestTaskServiceData).toEqual({
      id: 'performer-task-1',
      taskType: TaskTypeEnum.PerformerTaskResource,
    });
  });

  it('should return correct values from getters when data exists and undefined when not', () => {
    const viewState = createMockViewState();
    component.data = viewState;
    expect(component.prescription).toEqual(viewState.prescription);
    expect(component.patient).toEqual(viewState.patient);
    expect(component.currentUser).toEqual(viewState.currentUser);

    component.data = undefined;
    expect(component.prescription).toBeUndefined();
    expect(component.patient).toBeUndefined();
    expect(component.currentUser).toBeUndefined();
  });

  it('should not display the print button when user is organization', () => {
    component.data = createMockViewState({
      currentUser: { ssin: 'user-ssin', discipline: 'nursing', role: 'organization' } as Partial<PersonResource>,
    });
    component.currentLang = Lang.EN.short;

    fixture.detectChanges();
    const actionButton = fixture.debugElement.query(By.css('button'));
    expect(actionButton).toBeTruthy();
    actionButton.nativeElement.click();

    fixture.detectChanges();

    const printButton = fixture.debugElement.query(By.css('[data-cy="prescription-print-button"]'));
    expect(printButton).toBeNull();
  });

  it('should display the print button when user is Not an organization', () => {
    component.data = createMockViewState();
    component.currentLang = Lang.EN.short;

    fixture.detectChanges();
    const actionButton = fixture.debugElement.query(By.css('button'));
    expect(actionButton).toBeTruthy();
    actionButton.nativeElement.click();

    fixture.detectChanges();

    const printButton = fixture.debugElement.query(By.css('[data-cy="prescription-print-button"]'));
    expect(printButton).toBeTruthy();
  });

  it('should create PDF and emit print event', () => {
    const mockBlob = new Blob(['test'], { type: 'application/pdf' });
    mockPdfService.createCommonPdf.mockReturnValue({ getBlob: (cb: (b: Blob) => void) => cb(mockBlob) });
    component.data = createMockViewState();
    component.currentLang = Lang.EN.short;
    const printSpy = jest.spyOn(component.print, 'emit');

    component.createPdf('print');

    expect(mockPdfService.createCommonPdf).toHaveBeenCalled();
    expect(printSpy).toHaveBeenCalledWith(mockBlob);
  });

  it('should create PDF and emit download event', () => {
    const mockBlob = new Blob(['test'], { type: 'application/pdf' });
    mockPdfService.createCommonPdf.mockReturnValue({ getBlob: (cb: (b: Blob) => void) => cb(mockBlob) });
    component.data = createMockViewState();
    component.currentLang = Lang.EN.short;
    const downloadSpy = jest.spyOn(component.download, 'emit');

    component.createPdf('download');

    expect(downloadSpy).toHaveBeenCalledWith(mockBlob);
  });

  it('should not create PDF when required data is missing', () => {
    component.currentLang = Lang.EN.short;

    [undefined, { decryptedResponses: undefined }, { template: undefined }, { templateVersion: undefined }].forEach(
      dataOverride => {
        component.data = dataOverride === undefined ? undefined : createMockViewState(dataOverride);
        component.createPdf('print');
      }
    );

    component.data = createMockViewState();
    component.currentLang = undefined;
    component.createPdf('print');

    expect(mockPdfService.createCommonPdf).not.toHaveBeenCalled();
  });

  it('should open cancel prescription dialog with correct data', () => {
    const prescription = { id: 'test-prescription' } as ReadRequestResource;
    const patient = { firstName: 'Jane' } as PersonResource;

    component.openCancelPrescriptionDialog(prescription, patient);

    expect(mockDialog.open).toHaveBeenCalledWith(CancelPrescriptionDialog, {
      data: { prescription, patient },
      panelClass: 'mh-dialog-container',
    });
  });

  it('should emit handleDuplicate with combined prescription and responses', () => {
    const viewState = createMockViewState();
    component.data = viewState;
    const duplicateSpy = jest.spyOn(component.handleDuplicate, 'emit');

    component.handleDuplicateClick();

    expect(duplicateSpy).toHaveBeenCalledWith({
      ...viewState.prescription,
      responses: viewState.decryptedResponses,
    });
  });

  it('should not emit handleDuplicate when data is incomplete', () => {
    const duplicateSpy = jest.spyOn(component.handleDuplicate, 'emit');

    component.data = undefined;
    component.handleDuplicateClick();

    component.data = createMockViewState({ prescription: undefined });
    component.handleDuplicateClick();

    component.data = createMockViewState({ decryptedResponses: undefined });
    component.handleDuplicateClick();

    expect(duplicateSpy).not.toHaveBeenCalled();
  });

  it('should emit handleExtend with combined prescription and responses', () => {
    const viewState = createMockViewState();
    component.data = viewState;
    const extendSpy = jest.spyOn(component.handleExtend, 'emit');

    component.handleExtendClick();

    expect(extendSpy).toHaveBeenCalledWith({
      ...viewState.prescription,
      responses: viewState.decryptedResponses,
    });
  });

  it('should open assign dialog with correctly mapped data', () => {
    const prescription = {
      id: 'prescription-123',
      referralTask: { id: 'referral-456' },
      performerTasks: {
        'ssin-1': [{ careGiverSsin: 'ssin-1' } as RequestTaskResource],
        'ssin-2': [{ careGiverSsin: 'ssin-2' } as RequestTaskResource],
      },
      category: 'physiotherapy',
      intent: Intent.ORDER,
    } as ReadRequestResource;

    component.openAssignDialog(prescription);

    expect(mockDialog.open).toHaveBeenCalledWith(AssignOrTransferDialog, {
      data: {
        prescriptionId: 'prescription-123',
        referralTaskId: 'referral-456',
        category: 'physiotherapy',
        intent: Intent.ORDER,
        mode: 'assign',
      },
      panelClass: ['mh-dialog-container', 'mh-assign-dialog'],
      maxHeight: '90vh',
    });
  });

  it('should show error when onSelfAssign validation fails', () => {
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
      component.onSelfAssign(prescription, user);
    });

    expect(mockToastService.showSomethingWentWrong).toHaveBeenCalledTimes(4);
    expect(mockPrescriptionState.assignPrescriptionPerformer).not.toHaveBeenCalled();
  });

  it('should assign prescription successfully and show success toast', () => {
    const generatedUUIDSetSpy = jest.spyOn(mockSecondaryService.generatedUUID, 'set');
    const prescription = {
      id: 'prescription-id',
      referralTask: { id: 'referral-task-id' },
      intent: Intent.ORDER,
    } as ReadRequestResource;
    const user = UserNurse;
    mockPrescriptionState.assignPrescriptionPerformer.mockReturnValue(of({ id: 'task-1' }));

    component.onSelfAssign(prescription, user);

    expect(mockPrescriptionState.assignPrescriptionPerformer).toHaveBeenCalledWith(
      'prescription-id',
      'referral-task-id',
      'user-ssin',
      'NURSE',
      'Professional',
      'test-uuid-123'
    );

    expect(generatedUUIDSetSpy).toHaveBeenCalledWith('mocked-uuid');
    expect(mockToastService.show).toHaveBeenCalledWith('prescription.assignPerformer.meSuccess');
    expect(component.loading()).toBe(false);
  });

  it('should assign proposal successfully and show success toast', () => {
    const generatedUUIDSetSpy = jest.spyOn(mockSecondaryService.generatedUUID, 'set');
    const prescription = {
      id: 'prescription-id',
      referralTask: { id: 'referral-task-id' },
      intent: Intent.PROPOSAL,
    } as ReadRequestResource;
    const user = UserNurse;
    mockProposalState.assignProposalPerformer.mockReturnValue(of({ id: 'task-1' }));

    component.onSelfAssign(prescription, user);

    expect(mockProposalState.assignProposalPerformer).toHaveBeenCalledWith(
      'prescription-id',
      'referral-task-id',
      'user-ssin',
      'NURSE',
      'Professional',
      expect.any(String)
    );
    expect(generatedUUIDSetSpy).toHaveBeenCalledWith('mocked-uuid');
    expect(mockToastService.show).toHaveBeenCalledWith('proposal.assignPerformer.meSuccess');
  });

  it('should handle assignment error and show error toast', () => {
    const generatedUUIDSetSpy = jest.spyOn(mockSecondaryService.generatedUUID, 'set');

    const prescription = {
      id: 'prescription-id',
      referralTask: { id: 'referral-task-id' },
      intent: Intent.ORDER,
    } as ReadRequestResource;
    const user = UserNurse;
    mockPrescriptionState.assignPrescriptionPerformer.mockReturnValue(throwError(() => new Error('API Error')));

    component.onSelfAssign(prescription, user);

    expect(generatedUUIDSetSpy).toHaveBeenCalledWith('mocked-uuid');
    expect(mockToastService.showSomethingWentWrong).toHaveBeenCalled();
    expect(component.loading()).toBe(false);
  });

  describe('assignCaregivers', () => {
    it('should show a general error and returns early when prescription has no id', async () => {
      const prescription = { referralTask: { id: 'task-1' } } as ReadRequestResource;

      await component.openAutoAssign(prescription);

      expect(mockAlertService.showGeneralError).toHaveBeenCalledWith(ERROR_PRESCRIPTION_DETAILS);
      expect(component.loadingActions()).toBe(false);
    });

    it('should show a general error and returns early when referralTask has no id', async () => {
      const prescription = { id: 'prescription-1', referralTask: {} } as ReadRequestResource;

      await component.openAutoAssign(prescription);

      expect(mockAlertService.showGeneralError).toHaveBeenCalledWith(ERROR_PRESCRIPTION_DETAILS);
      expect(component.loadingActions()).toBe(false);
    });

    it('should call assignMultipleCaregivers with correct args after a successful FETCH_PROFESSIONAL_DATA dispatch', async () => {
      const assignees: AssignCareGiverResource[] = [{ id: 'caregiver-1' } as unknown as AssignCareGiverResource];
      const prescription: ReadRequestResource = {
        id: 'prescritpion-1',
        referralTask: { id: 'task-1' },
        intent: 'proposal',
      } as ReadRequestResource;

      jest.spyOn(component.handleAutoAssign, 'emit').mockImplementation((event: any) => {
        event.payload.resolve(assignees);
      });
      mockPrescriptionState.assignMultipleCaregivers.mockReturnValue(of([]));

      await component.openAutoAssign(prescription);

      expect(mockPrescriptionState.assignMultipleCaregivers).toHaveBeenCalledWith(
        'prescritpion-1',
        'task-1',
        assignees,
        expect.any(String),
        AssignationType.Internal
      );
      expect(component.loadingActions()).toBe(false);
      expect(mockToastService.show).toHaveBeenCalledWith('proposal.autoAssign.success');
    });

    it('should show a general error (no retry) when the host rejects the dispatch promise', async () => {
      const prescription: ReadRequestResource = {
        id: 'prescritpion-1',
        referralTask: { id: 'task-1' },
      } as ReadRequestResource;

      jest.spyOn(component.handleAutoAssign, 'emit').mockImplementation((event: any) => {
        event.payload.reject(new Error('Network failure'));
      });

      await component.openAutoAssign(prescription);

      expect(mockAlertService.showGeneralError).toHaveBeenCalledWith(ERROR_PRESCRIPTION_DETAILS, expect.any(String), {
        retry: false,
      });
      expect(component.loadingActions()).toBe(false);
    });

    it('should reset loadingActions on assignMultipleCaregivers error and does not show a success toast', async () => {
      const assignees: AssignCareGiverResource[] = [];
      const prescription: ReadRequestResource = {
        id: 'prescritpion-1',
        referralTask: { id: 'task-1' },
        intent: 'prescription',
      } as ReadRequestResource;

      jest.spyOn(component.handleAutoAssign, 'emit').mockImplementation((event: any) => {
        event.payload.resolve(assignees);
      });
      mockPrescriptionState.assignMultipleCaregivers.mockReturnValue(throwError(() => new Error('assign failed')));

      await component.openAutoAssign(prescription);

      expect(component.loadingActions()).toBe(false);
      expect(mockToastService.show).not.toHaveBeenCalled();
    });
  });
});
