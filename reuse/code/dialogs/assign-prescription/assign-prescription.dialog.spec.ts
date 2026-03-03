import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ProposalState } from '@reuse/code/states/api/proposal.state';
import { AssignPrescriptionDialog } from './assign-prescription.dialog';
import { LANGUAGES } from '@reuse/code/constants/languages';
import { GeographyService } from '@reuse/code/services/api/geography.service';
import { ToastService } from '@reuse/code/services/helpers/toast.service';
import { PrescriptionState } from '@reuse/code/states/api/prescription.state';
import { HealthcareProviderService } from '@reuse/code/services/api/healthcareProvider.service';
import { OrganizationService } from '@reuse/code/services/helpers/organization.service';
import * as utilsModule from '@reuse/code/utils/utils';
import { HealthcareOrganizationResource, HealthcareProResource } from '@reuse/code/openapi';
import * as uuid from 'uuid';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('AssignPrescriptionDialog', () => {
  let component: AssignPrescriptionDialog;
  let fixture: ComponentFixture<AssignPrescriptionDialog>;
  let uuidSpy: jest.SpyInstance;
  let translate: TranslateService;

  const dialogRefMock = { close: jest.fn() };
  const toastServiceMock = { show: jest.fn() };

  const prescriptionStateMock = {
    assignPrescriptionPerformer: jest.fn(),
  };

  const proposalStateMock = {
    assignProposalPerformer: jest.fn(),
  };

  const healthcareProviderServiceMock = {
    findAll: jest.fn(),
  };

  const geographyServiceMock = {
    findAll: jest.fn(),
  };

  const organizationServiceMock = {
    getGroupNameByCode: jest.fn().mockReturnValue('hospital'),
  };

  const dialogDataMock = {
    prescriptionId: '123',
    referralTaskId: '456',
    assignedCareGivers: [],
    assignedOrganizations: [],
    category: 'TEST',
    intent: 'PRESCRIPTION',
  };

  beforeEach(async () => {
    uuidSpy = jest.spyOn(uuid, 'v4').mockReturnValue('mock-uuid-12345' as unknown as Uint8Array);

    await TestBed.configureTestingModule({
      imports: [AssignPrescriptionDialog, ReactiveFormsModule, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefMock },
        { provide: MAT_DIALOG_DATA, useValue: dialogDataMock },
        { provide: PrescriptionState, useValue: prescriptionStateMock },
        { provide: ProposalState, useValue: proposalStateMock },
        { provide: HealthcareProviderService, useValue: healthcareProviderServiceMock },
        { provide: GeographyService, useValue: geographyServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
        { provide: OrganizationService, useValue: organizationServiceMock },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    translate = TestBed.inject(TranslateService);
    translate.setDefaultLang(LANGUAGES.DUTCH_BE);
    translate.use(LANGUAGES.DUTCH_BE);
    fixture = TestBed.createComponent(AssignPrescriptionDialog);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  afterEach(() => {
    uuidSpy.mockRestore();
    jest.clearAllMocks();
  });

  describe('Creation & lifecycle', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should generate UUID on ngOnInit', () => {
      component.ngOnInit();
      expect(component.generatedUUID).toBeTruthy();
    });
  });

  describe('Assignment logic', () => {
    it('should assign prescription when intent is prescription', fakeAsync(() => {
      jest.spyOn(utilsModule, 'isProposal').mockReturnValue(false);

      prescriptionStateMock.assignPrescriptionPerformer.mockReturnValue(of({}));

      const professional = {
        type: 'Professional',
        healthcarePerson: { firstName: 'John', lastName: 'Doe' },
      } as any;

      component.ngOnInit();
      component.onAssign(professional);
      tick();

      expect(prescriptionStateMock.assignPrescriptionPerformer).toHaveBeenCalled();
      expect(toastServiceMock.show).toHaveBeenCalled();
      expect(dialogRefMock.close).toHaveBeenCalledWith(professional);
    }));

    it('should assign proposal when intent is proposal', fakeAsync(() => {
      jest.spyOn(utilsModule, 'isProposal').mockReturnValue(true);

      proposalStateMock.assignProposalPerformer.mockReturnValue(of({}));

      const professional = {
        type: 'Professional',
        healthcarePerson: { firstName: 'Jane' },
      } as any;

      component.ngOnInit();
      component.onAssign(professional);
      tick();

      expect(proposalStateMock.assignProposalPerformer).toHaveBeenCalled();
      expect(dialogRefMock.close).toHaveBeenCalledWith(professional);
    }));

    it('should handle assignment error', fakeAsync(() => {
      jest.spyOn(utilsModule, 'isProposal').mockReturnValue(false);

      prescriptionStateMock.assignPrescriptionPerformer.mockReturnValue(throwError(() => new Error('FAIL')));

      component.ngOnInit();
      component.onAssign({ type: 'Professional' } as any);
      tick();

      expect(component.loading).toBe(false);
    }));
  });

  describe('onAssign', () => {
    it('should assign a caregiver performer', fakeAsync(() => {
      const providerMock = {
        id: { ssin: 'ssin-123' },
        type: 'Professional',
        healthcarePerson: { name: 'John Doe' },
      } as HealthcareProResource;

      prescriptionStateMock.assignPrescriptionPerformer.mockReturnValue(of({}));

      component.onAssign(providerMock);
      tick();

      expect(prescriptionStateMock.assignPrescriptionPerformer).toHaveBeenCalledWith(
        '123',
        '456',
        providerMock,
        'mock-uuid-12345'
      );

      expect(toastServiceMock.show).toHaveBeenCalledWith('prescription.assignPerformer.success', expect.any(Object));

      expect(dialogRefMock.close).toHaveBeenCalledWith(providerMock);
    }));

    it('should show success toast for organization assignment', fakeAsync(() => {
      jest.spyOn(utilsModule, 'isProposal').mockReturnValue(true);

      const organizationMock = {
        organizationName: { fr: 'Hospital ABC' },
        type: 'Organization',
      } as HealthcareOrganizationResource;

      prescriptionStateMock.assignPrescriptionPerformer.mockReturnValue(of({}));

      component.onAssign(organizationMock);
      tick();

      expect(toastServiceMock.show).toHaveBeenCalledWith(
        'proposal.assignPerformer.successOrganization',
        expect.any(Object)
      );
    }));
  });

  describe('Search & API pipeline', () => {
    it('should set searchCriteria$ on valid search()', fakeAsync(() => {
      component.onSearch({
        query: 'John',
        zipCodes: [],
      });
      tick();

      const criteria = component.searchCriteria$();
      expect(criteria?.query).toBe('John');
    }));
  });
});
