import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';

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

  let uuidSpy: jest.SpyInstance;

  let mockDialogRef: Partial<MatDialogRef<AssignOrTransferDialog>>;
  let mockToastService: Partial<ToastService>;
  let prescriptionStateMock: jest.Mocked<PrescriptionState>;
  let proposalStateMock: jest.Mocked<ProposalState>;
  let healthcareProviderServiceMock: jest.Mocked<HealthcareProviderService>;
  let dialogData: AssignOrTransferDialogData;

  beforeEach(async () => {
    uuidSpy = jest.spyOn(uuid, 'v4').mockReturnValue('mock-uuid-12345' as unknown as Uint8Array);

    mockDialogRef = { close: jest.fn() };
    mockToastService = { show: jest.fn() };

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

    dialogData = {
      mode: 'assign',
      prescriptionId: '123',
      referralTaskId: 'refTask',
      category: 'physician',
      intent: Intent.ORDER,
    };

    await TestBed.configureTestingModule({
      imports: [AssignOrTransferDialog, ReactiveFormsModule, NoopAnimationsModule, TranslateModule.forRoot()],
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
      (component as any).data = { ...dialogData, mode: 'transfer' };

      expect(component.modeKey).toBe('transferPerformer');
    });
  });

  describe('Search Functionality', () => {
    it('should set search criteria when onSearch is called', () => {
      const criteria = { query: 'John', zipCodes: [1000], page: 1, pageSize: 10 };

      component.onSearch(criteria);
      expect(component.searchCriteria$()).toEqual(criteria);
    });
  });

  describe('Selecting Professionals', () => {
    it('should set selected professional', () => {
      const professional = { id: { ssin: '123' }, healthcarePerson: 'John Doe' };
      component.selectProfessional(professional as any);
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
      const professional = { id: { ssin: '123', profession: 'doctor' }, healthcarePerson: 'John Doe' };
      component.selectedProfessional.set(professional as any);
      const spy = jest.spyOn(component, 'executeAction');
      component.onSubmitSelectedValue();
      expect(spy).toHaveBeenCalledWith(professional);
    });
  });

  describe('Action Execution (executeAction)', () => {
    it('should call executeAssign for assign mode', () => {
      const professional = { id: { ssin: '123', profession: 'doctor' }, healthcarePerson: 'John Doe' };
      const spy = jest.spyOn(component as any, 'executeAssign');
      (component as any).data = { ...dialogData, mode: 'assign' };

      component.executeAction(professional as any);
      expect(spy).toHaveBeenCalledWith(professional);
    });

    it('should call executeTransfer for transfer mode', () => {
      const professional = { id: { ssin: '123', profession: 'doctor' }, healthcarePerson: 'John Doe' };
      const spy = jest.spyOn(component as any, 'executeTransfer');
      (component as any).data = { ...dialogData, mode: 'transfer' };

      component.executeAction(professional as any);
      expect(spy).toHaveBeenCalledWith(professional);
    });
  });

  describe('Service Execution (executeService)', () => {
    it('should call toast and close dialog on service success', done => {
      const professional = { healthcarePerson: 'John Doe' };
      const serviceCall = () => of(true);
      const spyClose = jest.spyOn(mockDialogRef, 'close');

      (component as any).executeService(serviceCall, 'success.key', professional);

      setTimeout(() => {
        expect(mockToastService.show).toHaveBeenCalledWith('success.key', { interpolation: 'John Doe' });
        expect(spyClose).toHaveBeenCalledWith(professional);
        done();
      });
    });
  });

  describe('executeTransfer', () => {
    const professional = {
      id: { ssin: '987', profession: 'nurse' },
      healthcarePerson: 'Jane Doe',
    };

    beforeEach(() => {
      (component as any).data = {
        ...dialogData,
        mode: 'transfer',
        performerTaskId: 'performer123',
      };
    });

    it('should call prescription transfer service', () => {
      const professional = {
        id: {
          ssin: '987',
          profession: 'nurse',
        },
        healthcarePerson: { firstName: 'Jane' },
        type: 'Professional',
      };

      component.executeAction(professional as any);

      expect(prescriptionStateMock.transferAssignation).toHaveBeenCalledWith(
        '123',
        'refTask',
        'performer123',
        { ssin: '987', discipline: 'nurse' },
        'mock-uuid-12345'
      );
    });

    it('should call proposal transfer service for proposal intent', () => {
      (component as any).data = {
        ...dialogData,
        intent: Intent.PROPOSAL,
        mode: 'transfer',
        performerTaskId: 'performer123',
      };

      const professional = {
        id: {
          ssin: '987',
          profession: 'nurse',
        },
        healthcarePerson: { firstName: 'Jane' },
        type: 'Professional',
      };

      component.executeAction(professional as any);

      expect(proposalStateMock.transferAssignation).toHaveBeenCalled();
    });
  });

  describe('healthcareProvidersState$', () => {
    it('should call healthcareProviderService.findAll when searchCriteria is set', fakeAsync(() => {
      const response = {
        healthcareProfessionals: [{ id: { ssin: '123' } }],
        total: 1,
      };

      healthcareProviderServiceMock.findAll.mockReturnValue(of(response));

      // activate the signal subscription
      component.healthcareProvidersState$();

      const criteria = { query: 'John', zipCodes: [1000], page: 1, pageSize: 10 };

      component.onSearch(criteria);

      fixture.detectChanges();

      tick(); // flush signal observable pipeline

      const state = component.healthcareProvidersState$();

      expect(healthcareProviderServiceMock.findAll).toHaveBeenCalled();
      expect(state?.data?.items.length).toBe(1);
    }));

    it('should return empty list when criteria is null', () => {
      component.searchCriteria$.set(null);

      const state = component.healthcareProvidersState$();

      expect(state?.data?.items).toEqual([]);
    });

    it('should handle service error gracefully', () => {
      (healthcareProviderServiceMock.findAll as jest.Mock).mockReturnValue(new Observable(sub => sub.error('error')));

      const criteria = { query: 'John', zipCodes: [1000], page: 1, pageSize: 10 };

      component.onSearch(criteria);

      const state = component.healthcareProvidersState$();

      expect(state?.data?.items).toEqual([]);
    });
  });
});
