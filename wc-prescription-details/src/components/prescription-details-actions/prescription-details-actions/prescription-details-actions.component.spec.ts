import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { PrescriptionDetailsActionsComponent } from './prescription-details-actions.component';
import { PrescriptionsPdfService } from '@reuse/code/services/helpers/prescription-pdf.service';
import { PrescriptionState } from '@reuse/code/states/api/prescription.state';
import { ProposalState } from '@reuse/code/states/api/proposal.state';
import { ToastService } from '@reuse/code/services/helpers/toast.service';
import {
  Discipline,
  FhirR4TaskStatus,
  PerformerTaskResource,
  PersonResource,
  ReadRequestResource,
} from '@reuse/code/openapi';
import { DeviceService } from '@reuse/code/services/helpers/device.service';
import { PrescriptionDetailsSecondaryService } from '../../prescription-details-secondary/prescription-details-secondary.service';
import { ViewState } from '../../../containers/prescription-details/prescription-details.component';
import { CancelPrescriptionDialog } from '@reuse/code/dialogs/cancel-prescription/cancel-prescription-dialog.component';
import { AssignPrescriptionDialog } from '@reuse/code/dialogs/assign-prescription/assign-prescription.dialog';
import { UserInfo } from '@reuse/code/interfaces';

const UserNurse: Partial<UserInfo> = { ssin: 'user-ssin', discipline: Discipline.Nurse };
const createPerformerTask = (overrides: Partial<PerformerTaskResource> = {}): PerformerTaskResource => ({
  id: 'default-task-id',
  status: FhirR4TaskStatus.Inprogress,
  ...overrides,
});

describe('PrescriptionDetailsActionsComponent', () => {
  let component: PrescriptionDetailsActionsComponent;
  let fixture: ComponentFixture<PrescriptionDetailsActionsComponent>;
  let mockPdfService: jest.Mocked<any>;
  let mockDialog: jest.Mocked<MatDialog>;
  let mockToastService: jest.Mocked<ToastService>;
  let mockPrescriptionState: jest.Mocked<PrescriptionState>;
  let mockProposalState: jest.Mocked<ProposalState>;

  const mockLoadingSignal = signal(false);
  const mockGeneratedUUID = jest.fn().mockReturnValue('test-uuid-123');

  const createMockViewState = (overrides = {}) =>
    ({
      prescription: {
        id: 'prescription-1',
        referralTask: { id: 'referral-1' },
        performerTasks: [{ careGiverSsin: 'ssin-1' }],
        organizationTasks: [{ organizationNihii: 'nihii-1' }],
        category: 'nursing-care',
        intent: 'order',
      } as ReadRequestResource,
      patient: { firstName: 'John' } as PersonResource,
      currentUser: { ssin: 'user-ssin', discipline: 'nursing', role: 'nurse' } as Partial<PersonResource>,
      decryptedResponses: { field1: 'value1' },
      template: { id: 'template-1' },
      templateVersion: { version: '1.0' },
      ...overrides,
    }) as unknown as ViewState;

  beforeEach(async () => {
    const mockSecondaryService = {
      getCurrentUser: jest.fn().mockReturnValue({ data: { ssin: 'current-user-ssin' } }),
      getPerformerTask: jest.fn().mockReturnValue({ data: { id: 'performer-task-1' } }),
      loading: mockLoadingSignal,
      generatedUUID: mockGeneratedUUID,
    };

    mockPdfService = { createCommonPdf: jest.fn() } as unknown as jest.Mocked<PrescriptionsPdfService>;
    mockDialog = { open: jest.fn() } as unknown as jest.Mocked<MatDialog>;
    mockToastService = { show: jest.fn(), showSomethingWentWrong: jest.fn() } as unknown as jest.Mocked<ToastService>;
    mockPrescriptionState = { assignPrescriptionToMe: jest.fn() } as unknown as jest.Mocked<PrescriptionState>;
    mockProposalState = { assignProposalToMe: jest.fn() } as unknown as jest.Mocked<ProposalState>;

    await TestBed.configureTestingModule({
      imports: [PrescriptionDetailsActionsComponent],
      providers: [
        { provide: DeviceService, useValue: {} },
        { provide: PrescriptionDetailsSecondaryService, useValue: mockSecondaryService },
        { provide: PrescriptionsPdfService, useValue: mockPdfService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: ToastService, useValue: mockToastService },
        { provide: PrescriptionState, useValue: mockPrescriptionState },
        { provide: ProposalState, useValue: mockProposalState },
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
    expect(component.performerTaskServiceData).toEqual({ id: 'performer-task-1' });
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

  it('should create PDF and emit print event', () => {
    const mockBlob = new Blob(['test'], { type: 'application/pdf' });
    mockPdfService.createCommonPdf.mockReturnValue({ getBlob: (cb: (b: Blob) => void) => cb(mockBlob) });
    component.data = createMockViewState();
    component.currentLang = 'en';
    const printSpy = jest.spyOn(component.print, 'emit');

    component.createPdf('print');

    expect(mockPdfService.createCommonPdf).toHaveBeenCalled();
    expect(printSpy).toHaveBeenCalledWith(mockBlob);
  });

  it('should create PDF and emit download event', () => {
    const mockBlob = new Blob(['test'], { type: 'application/pdf' });
    mockPdfService.createCommonPdf.mockReturnValue({ getBlob: (cb: (b: Blob) => void) => cb(mockBlob) });
    component.data = createMockViewState();
    component.currentLang = 'en';
    const downloadSpy = jest.spyOn(component.download, 'emit');

    component.createPdf('download');

    expect(downloadSpy).toHaveBeenCalledWith(mockBlob);
  });

  it('should not create PDF when required data is missing', () => {
    component.currentLang = 'en';

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
      performerTasks: [{ careGiverSsin: 'ssin-1' }, { careGiverSsin: 'ssin-2' }],
      organizationTasks: [{ organizationNihii: 'nihii-1' }],
      category: 'physiotherapy',
      intent: 'order',
    } as ReadRequestResource;

    component.openAssignDialog(prescription);

    expect(mockDialog.open).toHaveBeenCalledWith(AssignPrescriptionDialog, {
      data: {
        prescriptionId: 'prescription-123',
        referralTaskId: 'referral-456',
        assignedCareGivers: ['ssin-1', 'ssin-2'],
        assignedOrganizations: ['nihii-1'],
        category: 'physiotherapy',
        intent: 'order',
      },
      panelClass: 'mh-dialog-container',
      maxHeight: '90vh',
    });
  });

  it('should show error when onSelfAssign validation fails', () => {
    const validUser = UserNurse;

    const invalidCases = [
      {
        prescription: { referralTask: { id: 'referral-task-id' }, intent: 'order' } as ReadRequestResource,
        user: validUser,
      },
      { prescription: { id: 'prescription-id', intent: 'order' } as ReadRequestResource, user: validUser },
      {
        prescription: {
          id: 'prescription-id',
          referralTask: { id: 'referral-task-id' },
          intent: 'order',
        } as ReadRequestResource,
        user: undefined,
      },
      {
        prescription: {
          id: 'prescription-id',
          referralTask: { id: 'referral-task-id' },
          intent: 'order',
        } as ReadRequestResource,
        user: {},
      },
    ];

    invalidCases.forEach(({ prescription, user }) => {
      component.onSelfAssign(prescription, user);
    });

    expect(mockToastService.showSomethingWentWrong).toHaveBeenCalledTimes(4);
    expect(mockPrescriptionState.assignPrescriptionToMe).not.toHaveBeenCalled();
  });

  it('should assign prescription successfully and show success toast', () => {
    const prescription = {
      id: 'prescription-id',
      referralTask: { id: 'referral-task-id' },
      intent: 'order',
    } as ReadRequestResource;
    const user = UserNurse;
    mockPrescriptionState.assignPrescriptionToMe.mockReturnValue(of({ id: 'task-1' }));

    component.onSelfAssign(prescription, user);

    expect(mockPrescriptionState.assignPrescriptionToMe).toHaveBeenCalledWith(
      'prescription-id',
      'referral-task-id',
      UserNurse,
      'test-uuid-123'
    );
    expect(mockToastService.show).toHaveBeenCalledWith('prescription.assignPerformer.meSuccess');
    expect(component.loading()).toBe(false);
  });

  it('should assign proposal successfully and show success toast', () => {
    const prescription = {
      id: 'prescription-id',
      referralTask: { id: 'referral-task-id' },
      intent: 'proposal',
    } as ReadRequestResource;
    const user = UserNurse;
    mockProposalState.assignProposalToMe.mockReturnValue(of({ id: 'task-1' }));

    component.onSelfAssign(prescription, user);

    expect(mockProposalState.assignProposalToMe).toHaveBeenCalledWith(
      'prescription-id',
      'referral-task-id',
      UserNurse,
      'test-uuid-123'
    );
    expect(mockToastService.show).toHaveBeenCalledWith('proposal.assignPerformer.meSuccess');
  });

  it('should handle assignment error and show error toast', () => {
    const prescription = {
      id: 'prescription-id',
      referralTask: { id: 'referral-task-id' },
      intent: 'order',
    } as ReadRequestResource;
    const user = UserNurse;
    mockPrescriptionState.assignPrescriptionToMe.mockReturnValue(throwError(() => new Error('API Error')));

    component.onSelfAssign(prescription, user);

    expect(mockToastService.showSomethingWentWrong).toHaveBeenCalled();
    expect(component.loading()).toBe(false);
  });

  describe('getPerformerTask', () => {
    it('should return undefined when non-patient has no targetId', () => {
      const readyTask = createPerformerTask({ status: FhirR4TaskStatus.Ready });
      const prescription: ReadRequestResource = {
        performerTasks: [createPerformerTask(), readyTask],
      };

      const viewState = createMockViewState();
      component.data = viewState;

      expect(component.currentUser?.role).toBe('nurse');

      expect(component.getPerformerTask(prescription)).toBeUndefined();
    });

    it('should return task matching targetId for non-patient', () => {
      const viewState = createMockViewState();
      component.data = viewState;

      expect(component.currentUser?.role).toBe('nurse');
      expect(component.performerTaskServiceData).toEqual({ id: 'performer-task-1' });

      const targetTask = createPerformerTask({ id: 'performer-task-1' });
      const prescription: ReadRequestResource = {
        performerTasks: [createPerformerTask(), targetTask],
      };

      expect(component.getPerformerTask(prescription)).toBe(targetTask);
    });

    it('should fallback to organizationTasks when not found in performerTasks', () => {
      const viewState = createMockViewState({
        currentUser: { ssin: 'user-ssin', role: 'nurse' } as Partial<PersonResource>,
      });
      component.data = viewState;

      expect(component.currentUser?.role).toBe('nurse');

      const readyTask = createPerformerTask({ id: 'performer-task-1', status: FhirR4TaskStatus.Ready });
      const prescription: ReadRequestResource = {
        performerTasks: [],
        organizationTasks: [{ performerTasks: [readyTask] }],
      };

      expect(component.getPerformerTask(prescription)).toBe(readyTask);
    });

    it('should return undefined when user is patient', () => {
      const viewState = createMockViewState({
        currentUser: { ssin: 'user-ssin', role: 'patient' } as Partial<PersonResource>,
      });
      component.data = viewState;

      expect(component.currentUser?.role).toBe('patient');
      const readyTask = createPerformerTask({ status: FhirR4TaskStatus.Ready });
      const prescription: ReadRequestResource = {
        performerTasks: [],
        organizationTasks: [{ performerTasks: [readyTask] }],
      };

      expect(component.getPerformerTask(prescription)).toBeUndefined();
    });
  });
});
