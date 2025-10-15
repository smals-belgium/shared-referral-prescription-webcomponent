import { PrescriptionDetailsWebComponent } from '../../../../wc-prescription-details/src/components/prescription-details/prescription-details.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslateLoader, TranslateModule, TranslateService, Translation } from '@ngx-translate/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MatNativeDateModule } from '@angular/material/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { importProvidersFrom, SimpleChange, SimpleChanges } from '@angular/core';
import { ConfigurationService } from '@reuse/code/services/config/configuration.service';
import { AuthService } from '@reuse/code/services/auth/auth.service';
import { PseudonymisationHelper } from '@smals-belgium-shared/pseudo-helper';
import { ListPrescriptionsWebComponent } from './list-prescriptions.component';
import { of } from 'rxjs';
import { Intent, LoadingStatus } from '@reuse/code/interfaces';
import { By } from '@angular/platform-browser';
import { AccessMatrix, PageModelEntityDto, ReadRequestListResource, Template } from '@reuse/code/openapi';
import { PrescriptionFilterComponent } from '@reuse/code/components/prescription-filter/prescription-filter.component';
import { FeatureFlagService } from '@reuse/code/services/helpers/feature-flag.service';
import { FeatureFlagDirective } from '@reuse/code/directives/feature-flag.directive';

const mockPerson = {
  ssin: '90122712173',
  name: 'name of patient',
};

const mockAuthService = {
  init: jest.fn(),
  getClaims: jest.fn(() =>
    of({
      userProfile: mockPerson,
    })
  ),
  isProfessional: jest.fn(() => of(false)),
};

const mockPseudoClient = {
  getDomain: jest.fn(),
  identify: jest.fn(),
  identifyMultiple: jest.fn(),
  pseudonymize: jest.fn(),
  pseudonymizeMultiple: jest.fn(),
};

function MockPseudoHelperFactory() {
  return new PseudonymisationHelper(mockPseudoClient);
}

const mockConfigService = {
  getEnvironment: jest.fn(),
  getEnvironmentVariable: jest.fn(() => ({
    filters: true,
  })),
};

class FakeLoader implements TranslateLoader {
  getTranslation() {
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
  let featureService: FeatureFlagService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        PrescriptionDetailsWebComponent,
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: FakeLoader },
        }),
        MatDatepickerModule,
        MatNativeDateModule,
        FeatureFlagDirective,
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        DateAdapter,
        importProvidersFrom(MatNativeDateModule),
        { provide: ConfigurationService, useValue: mockConfigService },
        { provide: AuthService, useValue: mockAuthService },
        {
          provide: PseudonymisationHelper,
          useValue: MockPseudoHelperFactory(),
        },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    translate = TestBed.inject(TranslateService);
    dateAdapter = TestBed.inject(DateAdapter) as unknown as MockDateAdapter;
    featureService = TestBed.inject(FeatureFlagService);

    featureService.features.set({ filters: true });
  });

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

    const simpleChanges: SimpleChanges = { patientSsin: new SimpleChange('', ssin, true) };
    component.patientSsin = ssin;
    component.ngOnChanges(simpleChanges);

    expect(loadDataSpy).toHaveBeenCalledWith(1);
    expect(loadPrescriptionsSpy).toHaveBeenCalledWith(1, undefined);

    jest.spyOn(component['prescriptionsState'], 'loadPrescriptions').mockReturnValue();
    jest.spyOn(component['prescriptionsState'], 'loadPrescriptions').mockReturnValue();
  });

  it('should display a table when viewStatePrescriptions$ has data and state success', () => {
    createFixture();
    const { debugElement } = fixture;
    let prescriptionTable = debugElement.query(By.css('app-prescriptions-table'));

    expect(prescriptionTable).toBeNull();
    component.intent = 'order';
    component.patientSsin = 'ssin';
    component.isPrescriptionValue = true;

    const expectedState = {
      data: {
        prescriptions: {} as ReadRequestListResource,
        templates: [],
        proposals: {} as ReadRequestListResource,
        models: {} as PageModelEntityDto,
        accessMatrix: {} as AccessMatrix[],
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
        },
      },
      status: LoadingStatus.SUCCESS,
    };

    // @ts-expect-error: it's a test where we define the object, so the type check is not needed
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

    const simpleChanges: SimpleChanges = { patientSsin: new SimpleChange('', ssin, true) };
    component.patientSsin = ssin;
    component.ngOnChanges(simpleChanges);

    expect(loadDataSpy).toHaveBeenCalledWith(1);
    expect(loadProposalsSpy).toHaveBeenCalledWith(1, undefined);

    jest.spyOn(component['proposalsState'], 'loadProposals').mockReturnValue();
  });

  it('should render and pass correct inputs when templates exist on prescriptions', () => {
    createFixture();
    const template: Template = {
      code: 'template1',
      id: 1,
      labelTranslations: {} as Translation,
      metadata: {
        code: {},
        category: {},
      },
    };
    const accessMatrix = { view: true, edit: false } as unknown as AccessMatrix;
    const expectedState = {
      data: {
        prescriptions: {} as ReadRequestListResource,
        templates: [template],
        proposals: {} as ReadRequestListResource,
        models: {} as PageModelEntityDto,
        accessMatrix: [accessMatrix],
      },
      error: {
        prescriptions: undefined,
        proposals: undefined,
        models: undefined,
        templates: undefined,
        accessMatrix: undefined,
      },
      params: {
        prescriptions: {
          criteria: {
            patient: 'ssin',
            performer: undefined,
            requester: undefined,
          },
          page: 1,
          pageSize: 10,
        },
      },
      status: LoadingStatus.SUCCESS,
    };

    jest.spyOn(component, 'viewStatePrescriptions$').mockReturnValue(expectedState);

    component.isPrescriptionValue = true;

    fixture.detectChanges();

    const filterComponent = fixture.debugElement.query(By.directive(PrescriptionFilterComponent));
    expect(filterComponent).toBeTruthy();
    expect(filterComponent.componentInstance.templates).toEqual([template]);
    expect(filterComponent.componentInstance.accessMatrix).toEqual([accessMatrix]);
  });

  it('should emit onFilterChange', () => {
    createFixture();
    const template = {
      code: 'template1',
      id: 1,
      labelTranslations: {} as Translation,
      metadata: {
        code: {},
        category: {},
      },
    };

    const accessMatrix = {
      templateName: 'template1',
      consultProposal: true,
      consultPrescription: false,
    } as unknown as AccessMatrix;

    const expectedState = {
      data: {
        prescriptions: {} as ReadRequestListResource,
        templates: [template],
        proposals: {} as ReadRequestListResource,
        models: {} as PageModelEntityDto,
        accessMatrix: [accessMatrix],
      },
      error: {
        prescriptions: undefined,
        proposals: undefined,
        models: undefined,
        templates: undefined,
        accessMatrix: undefined,
      },
      params: {
        prescriptions: {
          criteria: {
            patient: 'ssin',
            performer: undefined,
            requester: undefined,
          },
          page: 1,
          pageSize: 10,
        },
      },
      status: LoadingStatus.SUCCESS,
    };
    component.isPrescriptionValue = true;

    jest.spyOn(component, 'viewStatePrescriptions$').mockReturnValue(expectedState);
    fixture.detectChanges();

    jest.spyOn(component, 'onFilterUpdate');

    const filterComponent = fixture.debugElement.query(By.directive(PrescriptionFilterComponent));
    filterComponent.triggerEventHandler('filterChange', {
      newCriteria: 'Updated',
    });
    fixture.detectChanges();
    expect(component.onFilterUpdate).toHaveBeenCalledWith({
      newCriteria: 'Updated',
    });
    const req = httpMock.expectOne('http://localhost/prescriptions/summary?historical=false&page=1&pageSize=10');
    expect(req.request.method).toBe('GET');
    req.flush({ status: 200 });
  });

  it('should hide component when templates are undefined on proposals', () => {
    const expectedState = {
      data: {
        prescriptions: {} as ReadRequestListResource,
        templates: undefined as unknown as Template[],
        proposals: {} as ReadRequestListResource,
        models: {} as PageModelEntityDto,
        accessMatrix: { view: true, edit: false } as unknown as AccessMatrix[],
      },
      error: {
        prescriptions: undefined,
        proposals: undefined,
        models: undefined,
        templates: undefined,
        accessMatrix: undefined,
      },
      params: {
        prescriptions: {
          criteria: {
            patient: 'ssin',
            performer: undefined,
            requester: undefined,
          },
          page: 1,
          pageSize: 10,
        },
      },
      status: LoadingStatus.SUCCESS,
    };

    jest.spyOn(component, 'viewStateProposals$').mockReturnValue(expectedState);
    fixture.detectChanges();
    const hiddenComponent = fixture.debugElement.query(By.directive(PrescriptionFilterComponent));
    expect(hiddenComponent).toBeFalsy();
  });

  describe('language switch', () => {
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
  });

  const createFixture = () => {
    fixture = TestBed.createComponent(ListPrescriptionsWebComponent);
    component = fixture.componentInstance;
    component.intent = 'order';
    fixture.detectChanges();
  };
});
