import { PrescriptionDetailsWebComponent } from '../../containers/prescription-details/prescription-details.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { PrescriptionDetailsSecondaryComponent } from './prescription-details-secondary.component';
import { ReadRequestResource } from '@reuse/code/openapi';
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

describe('PrescriptionDetailsSecondaryComponent', () => {
  let component: PrescriptionDetailsSecondaryComponent;
  let fixture: ComponentFixture<PrescriptionDetailsSecondaryComponent>;
  let dialog: MatDialog;
  let toaster: ToastService;
  let httpMock: HttpTestingController;
  let consoleSpy: jest.SpyInstance;

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

  const proposalRequest = (mockResponse: any) => {
    const req = httpMock.expectOne(BASE_URL + `/proposals/${id}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  };
});
