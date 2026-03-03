import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import * as uuid from 'uuid';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ProposalState } from '@reuse/code/states/api/proposal.state';
import { TransferAssignationDialog } from './transfer-assignation.dialog';
import { LANGUAGES } from '@reuse/code/constants/languages';
import { GeographyService } from '@reuse/code/services/api/geography.service';
import { ToastService } from '@reuse/code/services/helpers/toast.service';
import { PrescriptionState } from '@reuse/code/states/api/prescription.state';
import { HealthcareProviderService } from '@reuse/code/services/api/healthcareProvider.service';
import { OrganizationService } from '@reuse/code/services/helpers/organization.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

const dialogDataMock = {
  prescriptionId: '123',
  referralTaskId: '456',
  performerTaskId: '789',
  assignedCareGivers: ['111'],
  category: 'TEST',
  intent: 'PRESCRIPTION',
};

describe('TransferAssignationDialog', () => {
  let component: TransferAssignationDialog;
  let fixture: ComponentFixture<TransferAssignationDialog>;

  let uuidSpy: jest.SpyInstance;
  let translate: TranslateService;

  let prescriptionStateMock: jest.Mocked<PrescriptionState>;
  let proposalStateMock: jest.Mocked<ProposalState>;
  let healthcareProviderServiceMock: jest.Mocked<HealthcareProviderService>;
  let toastServiceMock: jest.Mocked<ToastService>;
  let geographyServiceMock: jest.Mocked<GeographyService>;
  let dialogRefMock: jest.Mocked<MatDialogRef<TransferAssignationDialog>>;

  beforeEach(async () => {
    uuidSpy = jest.spyOn(uuid, 'v4').mockReturnValue('mock-uuid-12345' as unknown as Uint8Array);

    prescriptionStateMock = {
      transferAssignation: jest.fn().mockReturnValue(of(void 0)),
    } as any;

    proposalStateMock = {
      transferAssignation: jest.fn().mockReturnValue(of(void 0)),
    } as any;

    healthcareProviderServiceMock = {
      findAll: jest.fn().mockReturnValue(
        of({
          healthcareProfessionals: [],
          total: 0,
        })
      ),
    } as any;

    toastServiceMock = {
      show: jest.fn(),
    } as any;

    geographyServiceMock = {
      findAll: jest.fn().mockReturnValue(of([])),
    } as any;

    dialogRefMock = {
      close: jest.fn(),
    } as any;

    const organizationServiceMock = {
      getGroupNameByCode: jest.fn().mockReturnValue('hospital'),
    };

    await TestBed.configureTestingModule({
      imports: [TransferAssignationDialog, ReactiveFormsModule, NoopAnimationsModule, TranslateModule.forRoot()],
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
    fixture = TestBed.createComponent(TransferAssignationDialog);
    component = fixture.componentInstance;

    jest.clearAllMocks();
    fixture.detectChanges();
  });

  afterEach(() => {
    uuidSpy.mockRestore();
  });

  describe('BASIC CREATION', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });
  });

  describe('ON SEARCH', () => {
    it('should set searchCriteria signal when onSearch is called', () => {
      const criteria = { query: 'John', zipCodes: [1000], page: 1, pageSize: 10 };

      component.onSearch(criteria);

      expect(component.searchCriteria$()).toEqual(criteria);
    });

    it('should start with null search criteria', () => {
      expect(component.searchCriteria$()).toBeNull();
    });
  });

  describe('SELECT PROFESSIONAL', () => {
    it('should set selected professional', () => {
      const professional = { id: { ssin: '123', profession: 'NURSE' }, healthcarePerson: { firstName: 'John' } } as any;

      component.selectProfessional(professional);

      expect(component.selectedProfessional()).toEqual(professional);
    });

    it('should clear selected professional when called with undefined', () => {
      const professional = { id: { ssin: '123' } } as any;
      component.selectProfessional(professional);

      component.selectProfessional(undefined);

      expect(component.selectedProfessional()).toBeUndefined();
    });
  });

  describe('ON TRANSFER SELECTED VALUE', () => {
    it('should show toast when no professional is selected', () => {
      component.selectProfessional(undefined);

      component.onTransferSelectedValue();

      expect(toastServiceMock.show).toHaveBeenCalledWith('prescription.transferProfessional.undefined');
    });

    it('should call onTransfer when a professional is selected', () => {
      const professional = { id: { ssin: '123', profession: 'NURSE' }, healthcarePerson: { firstName: 'John' } } as any;
      component.selectProfessional(professional);

      const spy = jest.spyOn(component, 'onTransfer');

      component.onTransferSelectedValue();

      expect(spy).toHaveBeenCalledWith(professional);
    });
  });

  describe('ON TRANSFER', () => {
    it('should directly close dialog if no prescriptionId', () => {
      (component as any).data = { ...dialogDataMock, prescriptionId: undefined };

      const professional = { id: { ssin: '123' } } as any;

      component.onTransfer(professional);

      expect(dialogRefMock.close).toHaveBeenCalledWith(professional);
    });

    it('should call prescriptionState.transferAssignation for PRESCRIPTION intent', () => {
      (component as any).data = { ...dialogDataMock, intent: 'Order' };
      component.ngOnInit();

      const professional = {
        id: { ssin: '999', profession: 'NURSE' },
        type: 'Professional',
        healthcarePerson: { firstName: 'Jane' },
      } as any;

      component.onTransfer(professional);

      expect(prescriptionStateMock.transferAssignation).toHaveBeenCalledWith(
        '123',
        '456',
        '789',
        { ssin: '999', discipline: 'NURSE' },
        'mock-uuid-12345'
      );
    });

    it('should call proposalState.transferAssignation for PROPOSAL intent', () => {
      (component as any).data = { ...dialogDataMock, intent: 'PROPOSAL' };
      component.ngOnInit();

      const professional = {
        id: { ssin: '999', profession: 'NURSE' },
        type: 'Professional',
        healthcarePerson: { firstName: 'Jane' },
      } as any;

      component.onTransfer(professional);

      expect(proposalStateMock.transferAssignation).toHaveBeenCalledWith(
        '123',
        '456',
        '789',
        { ssin: '999', discipline: 'NURSE' },
        'mock-uuid-12345'
      );
    });

    it('should show success toast and close dialog on successful transfer', () => {
      const professional = {
        id: { ssin: '999', profession: 'NURSE' },
        type: 'Professional',
        healthcarePerson: { firstName: 'Jane' },
      } as any;

      component.onTransfer(professional);

      expect(toastServiceMock.show).toHaveBeenCalledWith('prescription.transferAssignation.success', {
        interpolation: professional.healthcarePerson,
      });
      expect(dialogRefMock.close).toHaveBeenCalledWith(professional);
    });

    it('should set loading to false on transfer error', () => {
      prescriptionStateMock.transferAssignation.mockReturnValue(throwError(() => new Error('fail')));

      const professional = {
        id: { ssin: '999', profession: 'NURSE' },
        type: 'Professional',
        healthcarePerson: { firstName: 'Jane' },
      } as any;

      component.onTransfer(professional);

      expect(component.loading).toBe(false);
    });
  });
});
