import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
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

    await TestBed.configureTestingModule({
      imports: [TransferAssignationDialog, ReactiveFormsModule, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        {provide: PrescriptionState, useValue: prescriptionStateMock},
        {provide: ProposalState, useValue: proposalStateMock},
        {provide: HealthcareProviderService, useValue: healthcareProviderServiceMock},
        {provide: ToastService, useValue: toastServiceMock},
        {provide: GeographyService, useValue: geographyServiceMock},
        {provide: MatDialogRef, useValue: dialogRefMock},
        {
          provide: MAT_DIALOG_DATA,
          useValue: dialogDataMock,
        },
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
  })

  describe('NGONINIT', () => {
    it('should generate UUID on init', () => {
      component.ngOnInit();
      expect(component.generatedUUID).toBeTruthy();
    });
  })

  describe('FORM VALIDATION', () => {
    it('should be invalid when both query and cities are empty', () => {
      component.formGroup.setValue({
        query: '',
        cities: [],
        searchCity: '',
      });

      component.search();

      expect(component.formGroup.invalid).toBe(true);
    });

    it('should be valid with query only', () => {
      component.formGroup.setValue({
        query: 'John',
        cities: [],
        searchCity: '',
      });

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

      expect(component.formGroup.valid).toBe(true);
    });
  })

  describe('SEARCH()', () => {
    it('should set searchCriteria when form is valid', () => {
      component.formGroup.setValue({
        query: 'John',
        cities: [{zipCode: 1000} as any],
        searchCity: '',
      });

      const spy = jest.spyOn((component as any).searchCriteria$, 'set');

      component.search();

      expect(spy).toHaveBeenCalledWith({
        query: 'John',
        zipCodes: [1000],
        page: 1,
        pageSize: 10,
      });
    });
  })

  describe('LOAD DATA', () => {
    it('should call loadData and update search criteria', () => {
      const spy = jest.spyOn((component as any).searchCriteria$, 'set');

      component.formGroup.setValue({
        query: 'test',
        cities: [{zipCode: 2000} as any],
        searchCity: '',
      });

      component.loadData({pageIndex: 2, pageSize: 20});

      expect(spy).toHaveBeenCalledWith({
        query: 'test',
        zipCodes: [2000],
        page: 2,
        pageSize: 20,
      });
    });
  })

  describe('QUERY TYPE SWITCHING', () => {
    it('should switch to numeric mode on numeric input', () => {
      const event = {
        target: {value: '1'},
      } as any;

      component.onKeyUp(event);

      expect(component.queryIsNumeric).toBe(true);
    });

    it('should switch to text mode on text input', () => {
      const event = {
        target: {value: 'John'},
      } as any;

      component.onKeyUp(event);

      expect(component.queryIsNumeric).toBe(false);
    });
  })

  describe('CITY MANAGEMENT', () => {
    it('should add city', () => {
      const city = {zipCode: 1000} as any;
      const event = {
        option: {value: city},
      } as any;

      const input = {value: ''} as HTMLInputElement;

      component.formGroup.get('cities')!.setValue([]);

      component.addCity(event, input);

      expect(component.formGroup.get('cities')!.value).toEqual([city]);
    });

    it('should remove city', () => {
      const city = {zipCode: 3000} as any;

      component.formGroup.get('cities')!.setValue([city]);

      component.removeCity(city);

      expect(component.formGroup.get('cities')!.value).toEqual([]);
    });
  })


  describe('TRANSFER WITHOUT PRESCRIPTION', () => {
    it('should directly close dialog if no prescriptionId', () => {
      (component as any).data.prescriptionId = undefined;

      const professional = {id: {ssin: '123'}} as any;

      component.onTransfer(professional);

      expect(dialogRefMock.close).toHaveBeenCalledWith(professional);
    });
  })

});
