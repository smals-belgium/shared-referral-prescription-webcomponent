import { PrescriptionDetailsWebComponent } from '../../containers/prescription-details/prescription-details.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { PrescriptionDetailsSecondaryComponent } from './prescription-details-secondary.component';
import {ReadRequestResource, RequestStatus} from '@reuse/code/openapi';
import { AssignPrescriptionDialog } from '@reuse/code/dialogs/assign-prescription/assign-prescription.dialog';
import {
  FakeLoader,
  prescriptionResponse,
  organisationTask,
  referralTask,
  mockPerformerTask,
  mockPro,
  BASE_URL,
  prescriptionDetailsSecondaryMockService,
  id,
} from '../../../test.utils';
import { ToastService } from '@reuse/code/services/helpers/toast.service';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { PrescriptionDetailsSecondaryService } from './prescription-details-secondary.service';
import {By} from "@angular/platform-browser";
import {AccessMatrixState} from "@reuse/code/states/api/access-matrix.state";

describe('PrescriptionDetailsSecondaryComponent', () => {
  let component: PrescriptionDetailsSecondaryComponent;
  let fixture: ComponentFixture<PrescriptionDetailsSecondaryComponent>;
  let dialog: MatDialog;
  let toaster: ToastService;
  let httpMock: HttpTestingController;
  let consoleSpy: jest.SpyInstance;

  const proposalRequest = (mockResponse: any) => {
    const req = httpMock.expectOne(BASE_URL + `/proposals/${id}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  };

  beforeAll(() => {
    consoleSpy = jest.spyOn(global.console, 'error').mockImplementation(message => {
      if (!message?.message?.includes('Could not parse CSS stylesheet')) {
        global.console.warn(message);
      }
    });
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        PrescriptionDetailsWebComponent,
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: FakeLoader },
        }),
        MatDialogModule,
        NoopAnimationsModule,
      ],
      providers: [
        MatDialog,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PrescriptionDetailsSecondaryService, useValue: prescriptionDetailsSecondaryMockService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PrescriptionDetailsSecondaryComponent);
    component = fixture.componentInstance;

    dialog = TestBed.inject(MatDialog);
    toaster = TestBed.inject(ToastService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterAll(() => consoleSpy.mockRestore());

  afterEach(() => {
    httpMock.verify();
  });

  it('should open the dialogs when functions are called', () => {
    const openDialogSpy = jest.spyOn(dialog, 'open');

    const mockResponse = prescriptionResponse([organisationTask], referralTask, [
      mockPerformerTask,
    ]) as unknown as ReadRequestResource;

    const prescriptionTaskCaregiver = {
      prescriptionId: mockResponse.id,
      referralTaskId: referralTask.id,
      assignedCareGivers: [mockPerformerTask.careGiverSsin],
    };

    //openAssignDialog
    component.openAssignDialog(mockResponse);

    const paramsAssign = {
      data: {
        ...prescriptionTaskCaregiver,
        assignedOrganizations: [organisationTask.organizationNihii],
        intent: mockResponse.intent,
        category: mockResponse.category,
      },
      panelClass: 'mh-dialog-container',
      maxHeight: '90vh',
    };

    expect(openDialogSpy).toHaveBeenCalledTimes(1);
    expect(openDialogSpy).toHaveBeenCalledWith(AssignPrescriptionDialog, paramsAssign);
  });

  it('should show a toaster when you selfAssign is called successfully', () => {
    const toasterSpy = jest.spyOn(toaster, 'show');

    const mockResponse = prescriptionResponse([organisationTask], referralTask) as unknown as ReadRequestResource;

    expect(component.loading()).toBe(false);

    component.onSelfAssign(mockResponse, mockPro);
    expect(component.loading()).toBe(true);

    const body = {
      ssin: mockPro.ssin,
      role: mockPro.discipline.toUpperCase(),
    };
    const req = httpMock.expectOne(`${BASE_URL}/proposals/${mockResponse.id}/assign/${referralTask.id}`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toStrictEqual(body);
    req.flush({});

    proposalRequest({});

    expect(component.loading()).toBe(false);
    expect(toasterSpy).toHaveBeenCalledTimes(1);
    expect(toasterSpy).toHaveBeenCalledWith('proposal.assignPerformer.meSuccess');
  });
  it('should show error toaster when selfAssign fails', () => {
    const toasterSpy = jest.spyOn(toaster, 'showSomethingWentWrong');

    const mockResponse = prescriptionResponse([organisationTask], referralTask) as unknown as ReadRequestResource;

    expect(component.loading()).toBe(false);

    component.onSelfAssign(mockResponse, mockPro);
    expect(component.loading()).toBe(true);

    const req = httpMock.expectOne(`${BASE_URL}/proposals/${mockResponse.id}/assign/${referralTask.id}`);
    req.error(new ErrorEvent('Network error'));

    expect(component.loading()).toBe(false);
    expect(toasterSpy).toHaveBeenCalledTimes(1);
  });

  it('should show error when prescription.id is missing', () => {
    const toasterSpy = jest.spyOn(toaster, 'showSomethingWentWrong');

    const mockResponse = prescriptionResponse([organisationTask], referralTask) as unknown as ReadRequestResource;
    mockResponse.id = undefined;

    component.onSelfAssign(mockResponse, mockPro);

    expect(toasterSpy).toHaveBeenCalledTimes(1);
    expect(component.loading()).toBe(false);
  });

  it('should show error when referralTask.id is missing', () => {
    const toasterSpy = jest.spyOn(toaster, 'showSomethingWentWrong');

    const mockResponse = prescriptionResponse([organisationTask], referralTask) as unknown as ReadRequestResource;
    mockResponse.referralTask!.id = undefined;

    component.onSelfAssign(mockResponse, mockPro);

    expect(toasterSpy).toHaveBeenCalledTimes(1);
    expect(component.loading()).toBe(false);
  });

  it('should show error when currentUser is missing', () => {
    const toasterSpy = jest.spyOn(toaster, 'showSomethingWentWrong');

    const mockResponse = prescriptionResponse([organisationTask], referralTask) as unknown as ReadRequestResource;

    component.onSelfAssign(mockResponse, undefined);

    expect(toasterSpy).toHaveBeenCalledTimes(1);
    expect(component.loading()).toBe(false);
  });

  it('should show error when currentUser.ssin is missing', () => {
    const toasterSpy = jest.spyOn(toaster, 'showSomethingWentWrong');

    const mockResponse = prescriptionResponse([organisationTask], referralTask) as unknown as ReadRequestResource;
    const userWithoutSsin = {...mockPro, ssin: undefined};

    component.onSelfAssign(mockResponse, userWithoutSsin);

    expect(toasterSpy).toHaveBeenCalledTimes(1);
    expect(component.loading()).toBe(false);
  });

  it('should have loading signal initialized to false', () => {
    expect(component.loading()).toBe(false);
  });

  it('should hide self-assign button when no caregiver ssin', () => {
    const fixture = setupWith({
      intent: 'order',
    });

    expect(fixture.debugElement.query(By.css('[data-cy="prescription-self-assign-button"]'))).not.toBeNull();
    expect(fixture.debugElement.query(By.css('[data-cy="prescription-start-execution-button"]'))).not.toBeNull();
  });

  it('should hide caregiver action buttons when caregiver is already assigned', () => {
    const fixture = setupWith({
      intent: 'order',
      caregiver: '789',
    });

    expect(fixture.debugElement.query(By.css('[data-cy="prescription-self-assign-button"]'))).toBeNull();
    expect(fixture.debugElement.query(By.css('[data-cy="prescription-start-execution-button"]'))).toBeNull();
  });

  it('should hide caregiver action buttons when intent is proposal', () => {
    const fixture = setupWith({
      intent: 'proposal',
    });

    expect(fixture.debugElement.query(By.css('[data-cy="prescription-self-assign-button"]'))).toBeNull();
    expect(fixture.debugElement.query(By.css('[data-cy="prescription-start-execution-button"]'))).toBeNull();
  });

});

function setupWith(
    {
      intent = 'order',
      caregiver = undefined as string | undefined,
      currentUser = { ssin: '123' },
    } = {}
) {

  jest.spyOn(prescriptionDetailsSecondaryMockService, 'getPrescription')
      .mockReturnValue({
        data: {
          intent,
          status: RequestStatus.Open,
          templateCode: 'TEST',
        }
      });

  jest.spyOn(prescriptionDetailsSecondaryMockService, 'getPerformerTask')
      .mockReturnValue({ data: { careGiverSsin: caregiver } });

  jest.spyOn(prescriptionDetailsSecondaryMockService, 'getCurrentUser')
      .mockReturnValue({ data: currentUser });

  jest.spyOn(AccessMatrixState.prototype, 'hasAtLeastOnePermission')
      .mockReturnValue(true);

  const fixture = TestBed.createComponent(PrescriptionDetailsSecondaryComponent);
  fixture.detectChanges();
  return fixture;
}

