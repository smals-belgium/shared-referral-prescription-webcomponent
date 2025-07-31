import {
  PrescriptionDetailsWebComponent
} from '../../../../wc-prescription-details/src/components/prescription-details/prescription-details.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MatNativeDateModule } from '@angular/material/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { importProvidersFrom, SimpleChange, SimpleChanges } from '@angular/core';
import { ConfigurationService } from '@reuse/code/services/configuration.service';
import { AuthService } from '@reuse/code/services/auth.service';
import { PseudonymisationHelper } from '@smals-belgium-shared/pseudo-helper';
import { ListPrescriptionsWebComponent } from './list-prescriptions.component';
import { Observable, of } from 'rxjs';
import { Intent, LoadingStatus, PrescriptionModelRequest } from '@reuse/code/interfaces';
import { PrescriptionSummaryList } from '@reuse/code/interfaces/prescription-summary.interface';
import { By } from '@angular/platform-browser';

const mockPerson = {
  ssin: '90122712173',
  name: "name of patient"
}

const mockAuthService = {
  init: jest.fn(),
  getClaims: jest.fn(() => of({
    userProfile: mockPerson
  })),
  isProfessional: jest.fn(() => of(false))
}

const mockPseudoClient = {
  getDomain: jest.fn(),
  identify: jest.fn(),
  identifyMultiple: jest.fn(),
  pseudonymize: jest.fn(),
  pseudonymizeMultiple: jest.fn()
}

function MockPseudoHelperFactory() {
  return new PseudonymisationHelper(mockPseudoClient)
}

const mockConfigService = {
  getEnvironment: jest.fn(),
  getEnvironmentVariable: jest.fn()
}

class FakeLoader implements TranslateLoader {
  getTranslation(lang: string): Observable<any> {
    return of({});
  }
}

class MockDateAdapter {
  setLocale = jest.fn();
}

describe('ListPrescriptionsWebComponent', () => {
  let component: ListPrescriptionsWebComponent;
  let fixture: ComponentFixture<ListPrescriptionsWebComponent>;
  let httpMock: HttpTestingController;
  let translate: TranslateService;
  let dateAdapter: MockDateAdapter;


  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrescriptionDetailsWebComponent, TranslateModule.forRoot({
        loader: {provide: TranslateLoader, useClass: FakeLoader},
      }), HttpClientTestingModule, MatDatepickerModule,
        MatNativeDateModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        DateAdapter,
        importProvidersFrom(MatNativeDateModule),
        {provide: ConfigurationService, useValue: mockConfigService},
        {provide: AuthService, useValue: mockAuthService},
        {provide: PseudonymisationHelper, useValue: MockPseudoHelperFactory()},
      ],
    })
      .compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    translate = TestBed.inject(TranslateService);
    dateAdapter = TestBed.inject(DateAdapter) as unknown as MockDateAdapter;
  })

  afterEach(() => {
    httpMock.verify();
  });


  it('should create the app', () => {
    createFixture();
    expect(component).toBeTruthy();
  });

  it('should call loadPrescriptions if intent is order', () => {
    createFixture();
    const loadDataSpy = jest.spyOn(component, 'loadData');
    const loadPrescriptionsSpy = jest.spyOn(component, 'loadPrescriptions');
    const ssin = 'ssin';
    component.intent = 'order';
    component.isPrescriptionValue = true;

    const simpleChanges: SimpleChanges = {patientSsin: new SimpleChange('', ssin, true)}
    component.patientSsin = ssin;
    component.ngOnChanges(simpleChanges);

    expect(loadDataSpy).toHaveBeenCalledWith(1);
    expect(loadPrescriptionsSpy).toHaveBeenCalledWith(1, undefined);

    jest.spyOn(component['prescriptionsState'], 'loadPrescriptions').mockReturnValue()
  });

  it('should display a table when viewStatePrescriptions$ has data and state success', () => {
    createFixture();
    const {debugElement} = fixture;
    let prescriptionTable = debugElement.query(By.css('app-prescriptions-table'));
    expect(prescriptionTable).toBeNull();
    component.intent = 'order';
    component.patientSsin = 'ssin';
    component.isPrescriptionValue = true;

    const expectedState = {
      data: {
        prescriptions: {} as PrescriptionSummaryList,
        templates: [],
        proposals: {} as PrescriptionSummaryList,
        models: {} as PrescriptionModelRequest
      },
      error: {},
      params: {
        prescriptions: {
          criteria: {
            patient: 'ssin',
            performer: undefined,
            requester: undefined,
          },
          page: 1,
          pageSize: 10,
        }
      },
      status: LoadingStatus.SUCCESS
    };
    jest.spyOn(component, 'viewStatePrescriptions$').mockReturnValue(expectedState);

    fixture.detectChanges();

    prescriptionTable = debugElement.query(By.css('app-prescriptions-table'));
    expect(prescriptionTable).toBeTruthy();

    expect(component.viewStatePrescriptions$()).toEqual(expectedState);
  });

  it('should call loadProposals if intent is proposal', () => {
    createFixture();
    const loadDataSpy = jest.spyOn(component, 'loadData');
    const loadProposalsSpy = jest.spyOn(component, 'loadProposals');
    const ssin = 'ssin';
    component.intent = Intent.PROPOSAL;
    component.isProposalValue = true;

    const simpleChanges: SimpleChanges = {patientSsin: new SimpleChange('', ssin, true)}
    component.patientSsin = ssin;
    component.ngOnChanges(simpleChanges);

    expect(loadDataSpy).toHaveBeenCalledWith(1);
    expect(loadProposalsSpy).toHaveBeenCalledWith(1, undefined);

    jest.spyOn(component['proposalsState'], 'loadProposals').mockReturnValue()
  });

  describe("language switch", () => {
    it('should initialize language and locale if currentLang is not set', () => {
      translate.currentLang = '';
      const setLocalesSpy = jest.spyOn(dateAdapter, 'setLocale');

      createFixture();

      expect(translate.getDefaultLang()).toBe('fr-BE');
      expect(setLocalesSpy).toHaveBeenCalledWith('fr-BE');
    });

    it('should not call use() or setLocale() if language is already set', () => {
      translate.use('nl-BE');
      const setLocalesSpy = jest.spyOn(dateAdapter, 'setLocale');

      createFixture();

      expect(setLocalesSpy).not.toHaveBeenCalled();
    });
  })

  const createFixture = () => {
    fixture = TestBed.createComponent(ListPrescriptionsWebComponent);
    component = fixture.componentInstance;
    component.intent = 'order';
    fixture.detectChanges();
  }
});
