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
import { CityResource } from '@reuse/code/openapi';
import { SsinOrOrganizationIdPipe } from '@reuse/code/pipes/ssin-or-cbe.pipe';

describe('AssignPrescriptionDialog', () => {
  let component: AssignPrescriptionDialog;
  let fixture: ComponentFixture<AssignPrescriptionDialog>;

  let translate: TranslateService;

  const dialogRefMock = {close: jest.fn()};
  const toastServiceMock = {show: jest.fn()};

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

    await TestBed.configureTestingModule({
      imports: [AssignPrescriptionDialog, ReactiveFormsModule, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        {provide: MatDialogRef, useValue: dialogRefMock},
        {provide: MAT_DIALOG_DATA, useValue: dialogDataMock},
        {provide: PrescriptionState, useValue: prescriptionStateMock},
        {provide: ProposalState, useValue: proposalStateMock},
        {provide: HealthcareProviderService, useValue: healthcareProviderServiceMock},
        {provide: GeographyService, useValue: geographyServiceMock},
        {provide: ToastService, useValue: toastServiceMock},
        {provide: OrganizationService, useValue: organizationServiceMock},
      ],
    }).compileComponents();

    translate = TestBed.inject(TranslateService);
    translate.setDefaultLang(LANGUAGES.DUTCH_BE);
    translate.use(LANGUAGES.DUTCH_BE);
    fixture = TestBed.createComponent(AssignPrescriptionDialog);
    component = fixture.componentInstance;

    jest.clearAllMocks();
    fixture.detectChanges();
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

  describe('Form validation', () => {
    it('should be invalid when query and cities are empty', () => {
      component.formGroup.setValue({
        query: '',
        cities: [],
        searchCity: '',
      });

      component.formGroup.updateValueAndValidity();
      expect(component.formGroup.valid).toBe(false);
    });

    it('should be valid with query only', () => {
      component.formGroup.setValue({
        query: 'John',
        cities: [],
        searchCity: '',
      });

      component.formGroup.updateValueAndValidity();
      expect(component.formGroup.valid).toBe(true);
    });

    it('should be valid with cities only', () => {
      component.formGroup.setValue({
        query: '',
        cities: [{zipCode: 1000, cityName: 'Brussels'} as any],
        searchCity: '',
      });

      // force cross-control validators to re-evaluate
      component.formGroup.updateValueAndValidity();                     // re-evaluate whole group
      component.formGroup.get('query')!.updateValueAndValidity();      // ensure query validator runs
      component.formGroup.get('cities')!.updateValueAndValidity();     // ensure cities validator runs

      // component.formGroup.updateValueAndValidity();
      expect(component.formGroup.valid).toBe(true);
    });
  });

  describe('Search & API pipeline', () => {
    it('should set searchCriteria$ on valid search()', fakeAsync(() => {
      component.formGroup.setValue({
        query: 'John',
        cities: [],
        searchCity: '',
      });

      component.search();
      tick();

      const criteria = component.searchCriteria$();
      expect(criteria?.query).toBe('John');
      expect(criteria?.professionalType).toBe('CAREGIVER');
    }));

  });

  describe('Filters & pagination', () => {
    it('should update filter and trigger search on filterValues()', fakeAsync(() => {
      component.formGroup.setValue({
        query: 'John',
        cities: [],
        searchCity: '',
      });

      component.filterValues('ORGANIZATION');
      tick();

      expect(component.selectedFilter).toBe('ORGANIZATION');
      expect(component.searchCriteria$()?.professionalType).toBe('ORGANIZATION');
    }));

    it('should update page on loadData()', () => {
      component.formGroup.setValue({
        query: 'John',
        cities: [],
        searchCity: '',
      });

      component.loadData({pageIndex: 2, pageSize: 20});

      const criteria = component.searchCriteria$();
      expect(criteria?.page).toBe(2);
      expect(criteria?.pageSize).toBe(20);
    });
  });

  describe('Assignment logic', () => {
    it('should assign prescription when intent is prescription', fakeAsync(() => {
      jest.spyOn(utilsModule, 'isProposal').mockReturnValue(false);

      prescriptionStateMock.assignPrescriptionPerformer.mockReturnValue(of({}));

      const professional = {
        type: 'Professional',
        healthcarePerson: {firstName: 'John', lastName: 'Doe'},
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
        healthcarePerson: {firstName: 'Jane'},
      } as any;

      component.ngOnInit();
      component.onAssign(professional);
      tick();

      expect(proposalStateMock.assignProposalPerformer).toHaveBeenCalled();
      expect(dialogRefMock.close).toHaveBeenCalledWith(professional);
    }));

    it('should handle assignment error', fakeAsync(() => {
      jest.spyOn(utilsModule, 'isProposal').mockReturnValue(false);

      prescriptionStateMock.assignPrescriptionPerformer.mockReturnValue(
        throwError(() => new Error('FAIL'))
      );

      component.ngOnInit();
      component.onAssign({type: 'Professional'} as any);
      tick();

      expect(component.loading).toBe(false);
    }));
  });

  describe('City management', () => {
    it('should add city', () => {
      const city = {zipCode: 1000, cityName: 'Brussels'};
      const event = {option: {value: city}} as any;
      const input = {value: 'test'} as HTMLInputElement;

      component.formGroup.get('cities')!.setValue([]);


      component.addCity(event, input);

      expect(component.formGroup.get('cities')!.value).toEqual([city]);

      // expect(component.formGroup.get('cities')!.value.length).toBe(1);
      expect(input.value).toBe('');
    });

    it('should remove city', () => {
      // const city: CityResource = { zipCode: 1000, cityName: 'Brussels' };
      const city: CityResource = {zipCode: 1000};

      component.formGroup.get('cities')!.setValue([city]);

      component.removeCity(city);

      // expect(component.formGroup.get('cities')!.value.length).toBe(0);
      expect(component.formGroup.get('cities')!.value).toEqual([]);

    });
  });

  describe('UI helper methods', () => {
    it('should toggle healthcare provider details visibility', () => {

      const pipeSpy = jest
        .spyOn(SsinOrOrganizationIdPipe.prototype, 'transform')
        .mockReturnValue('ssin-123');

      const hp = {id: {ssin: '123'}} as any;
      const event = {stopPropagation: jest.fn()} as any;

      component.showDetailsOfHealthcareProvider(event, hp);
      expect(component.visibleDetailsOfHealthcareProvider.length).toBe(1);

      component.showDetailsOfHealthcareProvider(event, hp);
      expect(component.visibleDetailsOfHealthcareProvider.length).toBe(0);

      pipeSpy.mockRestore();
    });

    it('should detect street presence', () => {
      expect(component.hasStreet({fr: '', nl: '', de: ''} as any)).toBe(false);
      expect(component.hasStreet({fr: 'Rue', nl: '', de: ''} as any)).toBe(true);
    });

    it('should detect phone numbers', () => {
      const prof = {phoneNumbers: {mobileNumber: '123'}, type: 'Professional'} as any;
      expect(component.hasPhoneNumbers(prof)).toBe(true);
    });

    it('should compute colspan correctly', () => {
      const prof = {type: 'Professional', phoneNumbers: {}} as any;
      expect(component.getColSpan(prof)).toBe(5);

      const org = {type: 'Organization'} as any;
      expect(component.getColSpan(org)).toBe(5);
    });

    it('should resolve group name', () => {
      const name = component.getGroupName('HOSPITAL');
      expect(name).toBe('hospital');
    });
  });
});
