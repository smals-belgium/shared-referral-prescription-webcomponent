import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssignOrTransferDialog, AssignOrTransferDialogData } from './assign-or-transfer-dialog';

import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToastService } from '@reuse/code/services/helpers/toast.service';
import { PrescriptionState } from '@reuse/code/states/api/prescription.state';
import { ProposalState } from '@reuse/code/states/api/proposal.state';
import { HealthcareProviderService } from '@reuse/code/services/api/healthcareProvider.service';
import { TranslateModule } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import * as uuid from 'uuid';
import { Intent } from '@reuse/code/interfaces';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import {
  HealthcareProResource,
  HealthCareProviderRequestResource,
  HealthCareProviderResource,
  ProviderType,
} from '@reuse/code/openapi';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { SearchCriteria } from '@reuse/code/components/professional-form/search-form/professional-search-form.component';

describe('AssignOrTransferDialog', () => {
  beforeAll(() => {
    class MockIntersectionObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }

    (global as any).IntersectionObserver = MockIntersectionObserver;
  });

  let component: AssignOrTransferDialog;
  let fixture: ComponentFixture<AssignOrTransferDialog>;

  let mockDialogRef: Partial<MatDialogRef<AssignOrTransferDialog>>;
  let mockToastService: Partial<ToastService>;
  let prescriptionStateMock: jest.Mocked<PrescriptionState>;
  let proposalStateMock: jest.Mocked<ProposalState>;
  let healthcareProviderServiceMock: jest.Mocked<HealthcareProviderService>;
  let dialogData: AssignOrTransferDialogData;

  beforeEach(async () => {
    jest.spyOn(uuid, 'v4').mockReturnValue('mock-uuid-12345' as unknown as Uint8Array);

    mockDialogRef = { close: jest.fn() };
    mockToastService = { show: jest.fn() };

    prescriptionStateMock = {
      assignPrescriptionPerformer: jest.fn().mockReturnValue(of(void 0)),
      transferAssignation: jest.fn().mockReturnValue(of(void 0)),
    } as any;

    proposalStateMock = {
      assignProposalPerformer: jest.fn().mockReturnValue(of(void 0)),
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

    dialogData = {
      mode: 'assign',
      prescriptionId: '123',
      referralTaskId: 'refTask',
      category: 'physician',
      connectedUser: {
        discipline: 'PHYSICIAN',
      },
      intent: Intent.ORDER,
    };

    await TestBed.configureTestingModule({
      imports: [
        AssignOrTransferDialog,
        ReactiveFormsModule,
        NoopAnimationsModule,
        TranslateModule.forRoot(),
        MatIconTestingModule,
      ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: ToastService, useValue: mockToastService },
        { provide: PrescriptionState, useValue: prescriptionStateMock },
        { provide: ProposalState, useValue: proposalStateMock },
        { provide: HealthcareProviderService, useValue: healthcareProviderServiceMock },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AssignOrTransferDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('basic initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should generate a UUID on init', () => {
      component.ngOnInit();
      expect(component.generatedUUID).toBe('mock-uuid-12345');
    });

    it('should return correct mode and modeKey', () => {
      expect(component.mode).toBe('assign');
      expect(component.modeKey).toBe('assignPerformer');
      component['data'] = { ...dialogData, mode: 'transfer' };

      expect(component.modeKey).toBe('transferPerformer');
    });
  });

  describe('Search Functionality', () => {
    it('should set search criteria when onSearch is called', () => {
      const criteria: SearchCriteria = { query: 'John', cities: [{ zipCode: 1000 }] };

      component.onSearch(criteria);
      expect(component.searchCriteria$()).toEqual(criteria);
    });
  });

  describe('Selecting Professionals', () => {
    it('should set selected professional', () => {
      const professional: HealthcareProResource = { id: { ssin: '123' }, type: ProviderType.Professional };
      component.selectProfessional(professional);
      expect(component.selectedProfessional()).toBe(professional);
    });
  });

  describe('Submitting Selected Value', () => {
    it('should show toast if no professional is selected', () => {
      component.selectedProfessional.set(undefined);
      component.onSubmitSelectedValue();
      expect(mockToastService.show).toHaveBeenCalledWith('prescription.assignProfessional.undefined');
    });

    it('should execute assign if professional is selected', () => {
      const professional: HealthcareProResource = {
        id: { ssin: '123', profession: 'doctor' },
        type: ProviderType.Professional,
      };
      component.selectedProfessional.set(professional);
      const spy = jest.spyOn(component, 'executeAction');
      component.onSubmitSelectedValue();
      expect(spy).toHaveBeenCalledWith(professional);
    });
  });

  describe('Action Execution (executeAction)', () => {
    it('should call executeAssign for assign mode', () => {
      const professional: HealthcareProResource = {
        id: { ssin: '123', profession: 'doctor' },
        type: ProviderType.Professional,
      };
      const spy = jest.spyOn(component as any, 'executeAssign');
      component['data'] = { ...dialogData, mode: 'assign' };

      component.executeAction(professional);
      expect(spy).toHaveBeenCalledWith(professional);
    });

    it('should call executeTransfer for transfer mode', () => {
      const professional: HealthcareProResource = {
        id: { ssin: '123', profession: 'doctor' },
        type: ProviderType.Professional,
      };
      const spy = jest.spyOn(component as any, 'executeTransfer');
      component['data'] = { ...dialogData, mode: 'transfer' };

      component.executeAction(professional);
      expect(spy).toHaveBeenCalledWith(professional);
    });
  });

  describe('Service Execution (executeService)', () => {
    it('should call toast and close dialog on service success', done => {
      const professional: HealthcareProResource = {
        id: { ssin: '123', profession: 'doctor' },
        healthcarePerson: {
          firstName: 'John',
          lastName: 'Doe',
        },
        type: ProviderType.Professional,
      };
      const serviceCall = () => of(true);
      const spyClose = jest.spyOn(mockDialogRef, 'close');

      (component as any).executeService(serviceCall, 'success.key', professional);

      setTimeout(() => {
        expect(mockToastService.show).toHaveBeenCalledWith('success.key', {
          interpolation: professional.healthcarePerson,
        });
        expect(spyClose).toHaveBeenCalledWith(professional);
        done();
      });
    });
  });

  describe('executeTransfer', () => {
    beforeEach(() => {
      component['data'] = {
        ...dialogData,
        mode: 'transfer',
        performerTaskId: 'performer123',
      };
    });

    it('should call prescription transfer service', () => {
      const professional: HealthcareProResource = {
        healthcarePerson: { ssin: '987', firstName: 'Jane' },
        healthcareQualification: {
          id: { profession: 'nurse' },
        },
        type: ProviderType.Professional,
      };

      component.executeAction(professional);

      expect(prescriptionStateMock.transferAssignation).toHaveBeenCalledWith(
        '123',
        'refTask',
        'performer123',
        '987',
        'nurse',
        ProviderType.Professional,
        'mock-uuid-12345'
      );
    });

    it('should call proposal transfer service for proposal intent', () => {
      component['data'] = {
        ...dialogData,
        intent: Intent.PROPOSAL,
        mode: 'transfer',
        performerTaskId: 'performer123',
      };

      const professional: HealthCareProviderResource = {
        id: {
          ssin: '987',
          profession: 'nurse',
        },
        healthcarePerson: { firstName: 'Jane' },
        type: ProviderType.Professional,
      };

      component.executeAction(professional);

      expect(proposalStateMock.transferAssignation).toHaveBeenCalled();
    });
  });

  describe('healthcareProvidersState$', () => {
    it('should call healthcareProviderService.findAll when searchCriteria is set', () => {
      const mockResponse: HealthCareProviderRequestResource = {
        healthcarePro: [
          {
            id: {
              ssin: '987',
              profession: 'nurse',
            },
            healthcarePerson: { firstName: 'John' },
            type: ProviderType.Professional,
          },
        ],

        total: 1,
      };

      healthcareProviderServiceMock.findAll.mockReturnValue(of(mockResponse));

      // activate the signal subscription
      component.healthcareProvidersState$();

      const criteria: SearchCriteria = { query: 'John', cities: [{ zipCode: 1000 }] };
      component.onSearch(criteria);

      fixture.detectChanges();

      const state = component.healthcareProvidersState$();

      expect(healthcareProviderServiceMock.findAll).toHaveBeenCalled();
      expect(state?.data?.items.length).toBe(1);
      expect(state?.data?.items).toEqual(mockResponse.healthcarePro);
    });

    it('should return empty list when criteria is null', () => {
      component.searchCriteria$.set(null);

      const state = component.healthcareProvidersState$();

      expect(state?.data?.items).toEqual([]);
    });

    it('should handle service error gracefully', () => {
      (healthcareProviderServiceMock.findAll as jest.Mock).mockReturnValue(new Observable(sub => sub.error('error')));

      const criteria = { query: 'John', cities: [{ zipCode: 1000 }], page: 1, pageSize: 10 };

      component.onSearch(criteria);

      const state = component.healthcareProvidersState$();

      expect(state?.data?.items).toEqual([]);
    });

    it('should call findAll with ProviderType.All when providerType filter is ALL', () => {
      const response: HealthCareProviderRequestResource = { healthcarePro: [], total: 0 };
      healthcareProviderServiceMock.findAll.mockReturnValue(of(response as any));

      component.onSearch({ query: 'John', cities: [{ zipCode: 1000 }] });

      component['providerType'].set(ProviderType.All);
      fixture.detectChanges();

      expect(healthcareProviderServiceMock.findAll).toHaveBeenCalledWith(
        'John',
        [1000],
        expect.any(Array),
        [],
        ProviderType.All,
        '123',
        Intent.ORDER,
        component.currentLang,
        1,
        10
      );
    });

    it('should call findAll with ProviderType.Professional when providerType filter is PROFESSIONAL', () => {
      const response: HealthCareProviderRequestResource = { healthcarePro: [], total: 0 };
      healthcareProviderServiceMock.findAll.mockReturnValue(of(response));

      component.onSearch({ query: 'John', cities: [{ zipCode: 1000 }] });

      component['providerType'].set(ProviderType.Professional);
      fixture.detectChanges();

      expect(healthcareProviderServiceMock.findAll).toHaveBeenCalledWith(
        'John',
        [1000],
        expect.any(Array),
        [],
        ProviderType.Professional,
        '123',
        Intent.ORDER,
        component.currentLang,
        1,
        10
      );
    });

    it('should call findAll with ProviderType.Organization when providerType filter is ORGANIZATION', () => {
      const response: HealthCareProviderRequestResource = { healthcarePro: [], total: 0 };
      healthcareProviderServiceMock.findAll.mockReturnValue(of(response));

      component.onSearch({ query: 'John', cities: [{ zipCode: 1000 }] });

      component['providerType'].set(ProviderType.Organization);
      fixture.detectChanges();

      expect(healthcareProviderServiceMock.findAll).toHaveBeenCalledWith(
        'John',
        [1000],
        expect.any(Array),
        [],
        ProviderType.Organization,
        '123',
        Intent.ORDER,
        component.currentLang,
        1,
        10
      );
    });
  });
  describe('goBackToSearch', () => {
    it('should reset pagination and reset query field when professional form is about to be displayed', () => {
      const query = component.queryControl;
      const pagination = component['pageable'];
      const isSearchMode = component['isSearchMode'];

      expect(component['pageable']).toBeDefined();
      expect(component['isSearchMode']).toBeDefined();

      pagination.set({ page: 5, pageSize: 10 });
      isSearchMode.set(false);
      query.setValue('TestValue');
      query.markAsTouched();

      component.goBackToSearch();

      expect(pagination()).toStrictEqual({ page: 1, pageSize: 10 });
      expect(query.value).toBe('');
      expect(query.untouched).toBe(true);
      expect(isSearchMode()).toBe(true);
    });
  });

  describe('extractPerformerIdentifiers', () => {
    it('should extract identifiers correctly for an organization and call assign', () => {
      const org: HealthCareProviderResource = {
        typeCode: ProviderType.Organization,
        nihii8: '12345678',
        qualificationCode: '001',
      };

      component.executeAction(org);

      expect(prescriptionStateMock.assignPrescriptionPerformer).toHaveBeenCalledWith(
        '123',
        'refTask',
        '12345678001',
        '',
        ProviderType.Organization,
        'mock-uuid-12345'
      );
    });
  });
  describe('infoAlertDescription', () => {
    it('should return patient description key when connectedUser discipline is PATIENT and in assign dialog', () => {
      dialogData.connectedUser = { discipline: 'PATIENT' };

      const patientFixture = TestBed.createComponent(AssignOrTransferDialog);
      const patientComponent = patientFixture.componentInstance;
      patientFixture.detectChanges();

      expect(patientComponent.infoAlertDescription()).toBe(`prescription.assignPerformer.dialog.description.patient`);
    });

    it('should return general description key when user is Physician and in assign dialog', () => {
      const patientFixture = TestBed.createComponent(AssignOrTransferDialog);
      const patientComponent = patientFixture.componentInstance;
      patientFixture.detectChanges();

      expect(patientComponent.infoAlertDescription()).toBe(`prescription.assignPerformer.dialog.description.other`);
    });

    it('should return general description key when user is Patient and in transfer dialog ', () => {
      dialogData.connectedUser = { discipline: 'PATIENT' };
      dialogData.mode = 'transfer';

      const patientFixture = TestBed.createComponent(AssignOrTransferDialog);
      const patientComponent = patientFixture.componentInstance;
      patientFixture.detectChanges();

      expect(patientComponent.infoAlertDescription()).toBe(`prescription.transferPerformer.dialog.description`);
    });

    it('should safely fall back to other description key when connectedUser is undefined', () => {
      dialogData.connectedUser = { discipline: undefined };

      const undefinedFixture = TestBed.createComponent(AssignOrTransferDialog);
      const UndefinedComponent = undefinedFixture.componentInstance;
      undefinedFixture.detectChanges();

      expect(UndefinedComponent.infoAlertDescription()).toBe(`prescription.assignPerformer.dialog.description.other`);
    });
  });
  describe('providerType', () => {
    it('should initialize pageable with default page 1 and pageSize 10', () => {
      expect(component['pageable']()).toEqual({ page: 1, pageSize: 10 });
    });

    it('should reset page index to 1 and keep previous page size when providerType changes', () => {
      component['pageable'].set({ page: 4, pageSize: 25 });
      expect(component['pageable']()).toEqual({ page: 4, pageSize: 25 });

      component['providerType'].set(ProviderType.Professional);
      fixture.detectChanges();

      expect(component['pageable']()).toEqual({ page: 1, pageSize: 25 });
    });
  });
});
