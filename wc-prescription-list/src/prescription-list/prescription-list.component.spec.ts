import { PrescriptionDetailsWebComponent } from '../../../wc-prescription-details/src/containers/prescription-details/prescription-details.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslateLoader, TranslateModule, TranslateService, Translation } from '@ngx-translate/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MatNativeDateModule } from '@angular/material/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { ElementRef, importProvidersFrom, signal, SimpleChange, SimpleChanges } from '@angular/core';
import { ConfigurationService } from '@reuse/code/services/config/configuration.service';
import { AuthService } from '@reuse/code/services/auth/auth.service';
import { PseudonymisationHelper } from '@smals-belgium-shared/pseudo-helper';
import { PrescriptionListWebComponent } from './prescription-list.component';
import { BehaviorSubject, of } from 'rxjs';
import { Intent, LoadingStatus } from '@reuse/code/interfaces';
import { By } from '@angular/platform-browser';
import { AccessMatrix, Discipline, PageModelEntityDto, ReadRequestListResource, Template } from '@reuse/code/openapi';
import { ShadowDomOverlayContainer } from '@reuse/code/containers/shadow-dom-overlay/shadow-dom-overlay.container';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatDialog } from '@angular/material/dialog';
import { PrescriptionFilterComponent } from '@reuse/code/components/prescription-filter/prescription-filter.component';
import { FeatureFlagService } from '@reuse/code/services/helpers/feature-flag.service';
import { FeatureFlagDirective } from '@reuse/code/directives/feature-flag.directive';
import { PrescriptionsCardComponent } from '../components/prescriptions/prescriptions-card/prescriptions-card.component';
import { RequestSummaryDataService } from '@reuse/code/services/helpers/request-summary-data.service';

const BASE_URL = 'http://localhost';

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
  discipline: jest.fn(() => of(Discipline.Nurse)),
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

const containerElement = document.createElement('div');
const mockShadowDomOverlayContainer = {
  ngOnDestroy: jest.fn(),

  getRootElement: jest.fn().mockReturnValue(document.createElement('div').attachShadow({ mode: 'open' })),
  createContainer: jest.fn(),
  getContainerElement: jest.fn().mockReturnValue(containerElement),
  _createContainer: jest.fn(),
  _containerElement: containerElement,
  _document: document,
};

const mockDataService = {
  requestSummaryData$: new BehaviorSubject([]),
  loading$: new BehaviorSubject(false),
  initializeDataStream: jest.fn(),
  triggerLoad: jest.fn(),
  retryLoad: jest.fn(),
  reset: jest.fn(),
} as any;

describe('ListPrescriptionsWebComponent', () => {
  let component: PrescriptionListWebComponent;
  let fixture: ComponentFixture<PrescriptionListWebComponent>;
  let httpMock: HttpTestingController;
  let translate: TranslateService;
  let dateAdapter: MockDateAdapter;
  let mockDialog: jest.Mocked<MatDialog>;
  let featureService: FeatureFlagService;

  beforeEach(async () => {
    const dialogMock = {
      open: jest.fn(),
    } as unknown as jest.Mocked<MatDialog>;

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
        { provide: PseudonymisationHelper, useValue: MockPseudoHelperFactory() },
        { provide: ShadowDomOverlayContainer, useValue: mockShadowDomOverlayContainer },
        { provide: MatDialog, useValue: dialogMock },
        {
          provide: BreakpointObserver,
          useValue: {
            observe: jest.fn().mockReturnValue(of({ matches: true })),
          },
        },
      ],
    })
      .overrideComponent(PrescriptionsCardComponent, {
        set: {
          providers: [{ provide: RequestSummaryDataService, useValue: mockDataService }],
        },
      })
      .compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    translate = TestBed.inject(TranslateService);
    dateAdapter = TestBed.inject(DateAdapter) as unknown as MockDateAdapter;
    mockDialog = TestBed.inject(MatDialog) as jest.Mocked<MatDialog>;
    featureService = TestBed.inject(FeatureFlagService);

    featureService.features.set({ filters: true });
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('default behaviour with prescriptions', () => {
    it('should create the app', () => {
      createFixture();
      expect(component).toBeTruthy();
    });

    it('should display an error card when no patientSsin is set', () => {
      createFixture();

      const loadDataSpy = jest.spyOn(component, 'loadData');
      const loadPrescriptionsSpy = jest.spyOn(component, 'loadPrescriptions');

      const intent = Intent.ORDER;
      component.intent = intent;
      component.isPrescriptionValue = true;
      component.patientSsin = undefined;

      const simpleChanges: SimpleChanges = { intent: new SimpleChange('', intent, true) };
      component.ngOnChanges(simpleChanges);

      expect(loadDataSpy).toHaveBeenCalledWith({ pageIndex: 1 });
      expect(loadPrescriptionsSpy).not.toHaveBeenCalledWith();

      expect(component.errorCard.show).toBeTruthy();
      fixture.detectChanges();
      const { debugElement } = fixture;
      const alertComponent = debugElement.query(By.css('app-alert'));
      expect(alertComponent).toBeTruthy();
    });

    it('should call loadPrescriptions if intent is order', () => {
      createFixture();
      const loadDataSpy = jest.spyOn(component, 'loadData');
      const loadPrescriptionsSpy = jest.spyOn(component, 'loadPrescriptions');
      const ssin = 'ssin';
      component.intent = Intent.ORDER;
      component.isPrescriptionValue = true;

      const simpleChanges: SimpleChanges = { patientSsin: new SimpleChange('', ssin, true) };
      component.patientSsin = ssin;
      component.ngOnChanges(simpleChanges);

      expect(loadDataSpy).toHaveBeenCalledWith({ pageIndex: 1 });
      expect(loadPrescriptionsSpy).toHaveBeenCalledWith(1, undefined);

      jest.spyOn(component['prescriptionsState'], 'loadPrescriptions').mockReturnValue();
    });

    it('should display a table when viewStatePrescriptions$ has data and state success and breakpoint is NOT mobile', () => {
      createFixture();
      const { debugElement } = fixture;
      let prescriptionTable = debugElement.query(By.css('app-prescriptions-table'));
      expect(prescriptionTable).toBeNull();
      component.intent = Intent.ORDER;
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

    it('should display a list of cards when viewStatePrescriptions$ has data and state success and breakpoint is mobile', () => {
      const breakpointObserverTest = TestBed.inject(BreakpointObserver) as any;
      (breakpointObserverTest.observe as jest.Mock).mockReturnValue(of({ matches: false }));

      // Mock IntersectionObserver BEFORE createFixture()
      const mockObserve = jest.fn();
      const mockDisconnect = jest.fn();
      let observerCallback: IntersectionObserverCallback;

      global.IntersectionObserver = jest.fn().mockImplementation(callback => {
        observerCallback = callback;
        return {
          observe: mockObserve,
          disconnect: mockDisconnect,
          unobserve: jest.fn(),
          takeRecords: jest.fn(),
          root: null,
          rootMargin: '',
          thresholds: [],
        };
      }) as any;

      createFixture();

      const { debugElement } = fixture;
      let prescriptionListOfCards = debugElement.query(By.css('app-prescriptions-card'));
      expect(prescriptionListOfCards).toBeNull();
      component.intent = Intent.ORDER;
      component.patientSsin = 'ssin';
      component.isPrescriptionValue = true;

      const expectedState = {
        data: {
          prescriptions: {} as ReadRequestListResource,
          templates: [],
          proposals: {} as ReadRequestListResource,
          models: {} as PageModelEntityDto,
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

      // Verify observer was created and observe was called
      expect(global.IntersectionObserver).toHaveBeenCalled();
      expect(mockObserve).toHaveBeenCalled();

      // Simulate intersection
      observerCallback!([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);

      fixture.detectChanges();

      prescriptionListOfCards = debugElement.query(By.css('app-prescriptions-card'));
      expect(prescriptionListOfCards).toBeTruthy();

      expect(component.viewStatePrescriptions$()).toEqual(expectedState);
    });
  });

  describe('filter', () => {
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
      component.patientSsin = 'ssin';

      jest.spyOn(component, 'viewStatePrescriptions$').mockReturnValue(expectedState);
      const loadPrescriptionsSpy = jest.spyOn(component, 'loadPrescriptions');
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

      expect(loadPrescriptionsSpy).toHaveBeenCalledWith(1, undefined);
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
  });

  describe('load proposals or models', () => {
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

      expect(loadDataSpy).toHaveBeenCalledWith({ pageIndex: 1 });
      expect(loadProposalsSpy).toHaveBeenCalledWith(1, undefined);

      jest.spyOn(component['proposalsState'], 'loadProposals').mockReturnValue();
    });

    it('should call loadModals if intent is Model', () => {
      createFixture();
      const loadDataSpy = jest.spyOn(component, 'loadData');
      const loadProposalsSpy = jest.spyOn(component, 'loadProposals');
      const ssin = 'ssin';
      component.intent = Intent.PROPOSAL;
      component.isProposalValue = true;

      const simpleChanges: SimpleChanges = { patientSsin: new SimpleChange('', ssin, true) };
      component.patientSsin = ssin;
      component.ngOnChanges(simpleChanges);

      expect(loadDataSpy).toHaveBeenCalledWith({ pageIndex: 1 });
      expect(loadProposalsSpy).toHaveBeenCalledWith(1, undefined);

      jest.spyOn(component['proposalsState'], 'loadProposals').mockReturnValue();
    });
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

  describe('openCreateDialog', () => {
    it('should call openCreateDialog with Intent.ORDER when openNewPrescriptionDialog is called', () => {
      createFixture();
      const openCreateDialogSpy = jest.spyOn(component, 'openCreateDialog').mockImplementation();

      component.openNewPrescriptionDialog();

      expect(openCreateDialogSpy).toHaveBeenCalledWith(Intent.ORDER);
    });

    it('should call openCreateDialog with Intent.PROPOSAL when openNewProposalDialog is called', () => {
      createFixture();
      const openCreateDialogSpy = jest.spyOn(component, 'openCreateDialog').mockImplementation();

      component.openNewProposalDialog();

      expect(openCreateDialogSpy).toHaveBeenCalledWith(Intent.PROPOSAL);
    });

    it('should call openCreateDialog with Intent.MODEL when openNewModelDialog is called', () => {
      createFixture();
      const openCreateDialogSpy = jest.spyOn(component, 'openCreateDialog').mockImplementation();

      component.openNewModelDialog();

      expect(openCreateDialogSpy).toHaveBeenCalledWith(Intent.MODEL);
    });

    it('should open dialog with correct configuration and emit result', () => {
      createFixture();
      const spyOnClickCreateDetail = jest.spyOn(component.clickCreateDetail, 'emit');
      const selectedTemplate = { templateCode: 'TEST' };
      const mockDialogRef = {
        afterClosed: jest.fn().mockReturnValue(of(selectedTemplate)),
      };
      mockDialog.open.mockReturnValue(mockDialogRef as any);

      component.openCreateDialog(Intent.ORDER);

      expect(mockDialog.open).toHaveBeenCalledWith(expect.any(Function), {
        maxWidth: '100vw',
        width: '500px',
        autoFocus: false,
        panelClass: 'mh-dialog-container',
        data: {
          intent: Intent.ORDER,
        },
      });

      expect(spyOnClickCreateDetail).toHaveBeenCalledWith(selectedTemplate);
    });

    it('should not emit when dialog result is undefined', () => {
      createFixture();
      const spyOnClickCreateDetail = jest.spyOn(component.clickCreateDetail, 'emit');

      const mockDialogRef = {
        afterClosed: jest.fn().mockReturnValue(of(undefined)),
      };
      mockDialog.open.mockReturnValue(mockDialogRef as any);

      component.openCreateDialog(Intent.ORDER);

      expect(spyOnClickCreateDetail).not.toHaveBeenCalled();
    });
  });

  describe('openDeleteModelDialog', () => {
    const mockModel = { id: 123, label: 'Test Model' };

    it('should open delete confirmation dialog with correct data', () => {
      createFixture();
      const mockDialogRef = {
        beforeClosed: jest.fn().mockReturnValue(of(false)),
      };
      mockDialog.open.mockReturnValue(mockDialogRef as any);

      component.openDeleteModelDialog(mockModel);

      expect(mockDialog.open).toHaveBeenCalledWith(expect.any(Function), {
        data: {
          titleLabel: 'prescription.model.delete.title',
          messageLabel: 'prescription.model.delete.message',
          cancelLabel: 'common.cancel',
          okLabel: 'common.delete',
          params: {
            templateName: mockModel.label,
          },
        },
        panelClass: 'mh-dialog-container',
      });
    });

    it('should delete model and reload when confirmed', () => {
      createFixture();
      const mockDialogRef = {
        beforeClosed: jest.fn().mockReturnValue(of(true)),
      };
      mockDialog.open.mockReturnValue(mockDialogRef as any);
      const spyOnPrescriptionModalService = jest.spyOn((component as any).prescriptionModelService, 'deleteModel');
      const spyOnLoadModels = jest.spyOn(component, 'loadModels');

      spyOnPrescriptionModalService.mockReturnValue(of({}));

      component.openDeleteModelDialog(mockModel);

      expect(spyOnPrescriptionModalService).toHaveBeenCalledWith(mockModel.id);
      expect(spyOnLoadModels).toHaveBeenCalledWith(0, 10);

      const req = httpMock.expectOne(`${BASE_URL}/prescriptionModels?page=0&pageSize=10`);
      expect(req.request.method).toBe('GET');
      req.flush({});
    });

    it('should not delete when cancelled', () => {
      createFixture();
      const mockDialogRef = {
        beforeClosed: jest.fn().mockReturnValue(of(false)),
      };
      mockDialog.open.mockReturnValue(mockDialogRef as any);
      const spyOnPrescriptionModalService = jest.spyOn((component as any).prescriptionModelService, 'deleteModel');

      component.openDeleteModelDialog(mockModel);

      expect(spyOnPrescriptionModalService).not.toHaveBeenCalled();
    });

    it('should not delete when model has no id', () => {
      createFixture();

      const modelWithoutId = { ...mockModel, id: undefined };
      const mockDialogRef = {
        beforeClosed: jest.fn().mockReturnValue(of(true)),
      };
      mockDialog.open.mockReturnValue(mockDialogRef as any);
      const spyOnPrescriptionModalService = jest.spyOn((component as any).prescriptionModelService, 'deleteModel');

      component.openDeleteModelDialog(modelWithoutId);

      expect(spyOnPrescriptionModalService).not.toHaveBeenCalled();
    });
  });

  describe('test functions', () => {
    it('should set searchCriteria historical to true and call loadData with page 1', () => {
      createFixture();
      const spyOnLoadData = jest.spyOn(component, 'loadData');

      component.handleHistoricPrescriptions(true);

      expect((component as any).searchCriteria$()).toEqual({ historical: true });
      expect(spyOnLoadData).toHaveBeenCalledWith({ pageIndex: 1 });
    });

    it('should set searchCriteria historical to false and call loadData with page 1', () => {
      createFixture();
      const spyOnLoadData = jest.spyOn(component, 'loadData');

      component.handleHistoricPrescriptions(false);

      expect((component as any).searchCriteria$()).toEqual({ historical: false });
      expect(spyOnLoadData).toHaveBeenCalledWith({ pageIndex: 1 });
    });

    it('should call shadowDomOverlay.createContainer', () => {
      createFixture();
      component.ngAfterViewInit();

      expect(mockShadowDomOverlayContainer.createContainer).toHaveBeenCalled();
    });

    it('should call showErrorCard when error is undefined', () => {
      createFixture();
      const spyOnShowErrorCard = jest.spyOn(component, 'showErrorCard');
      component.retryFailedCalls(undefined);

      expect(spyOnShowErrorCard).toHaveBeenCalled();
    });

    it('should call loadData when error has prescriptions', () => {
      createFixture();
      const spyOnLoadData = jest.spyOn(component, 'loadData');

      const error = {
        prescriptions: true,
        proposals: undefined,
        models: undefined,
        templates: undefined,
        accessMatrix: undefined,
      };

      component.retryFailedCalls(error);

      expect(spyOnLoadData).toHaveBeenCalled();
    });

    it('should emit SelectedTemplate with ANNEX_81 templateCode', () => {
      createFixture();
      const spyOnLoadData = jest.spyOn(component.clickCreateDetail, 'emit');

      component.openAnnex81ProposalForm();

      expect(spyOnLoadData).toHaveBeenCalledWith({
        templateCode: 'ANNEX_81',
      });
    });

    it('should return true on isNurse when discipline is Nurse', () => {
      createFixture();
      (component as any).discipline$ = signal(Discipline.Nurse);

      const result = component.isNurse();

      expect(result).toBe(true);
    });

    it('should return false on isNurse when discipline is not Nurse', () => {
      createFixture();
      (component as any).discipline$ = signal('DOCTOR' as any);

      const result = component.isNurse();

      expect(result).toBe(false);
    });

    it('should return true on canCreatePrescription when user has permission', () => {
      createFixture();
      const mockAccessMatrixState = jest.spyOn(
        (component as any).accessMatrixState,
        'hasAtLeastOnePermissionForAnyTemplate'
      );
      mockAccessMatrixState.mockReturnValue(true);

      const result = component.canCreatePrescription();

      expect(result).toBe(true);
      expect(mockAccessMatrixState).toHaveBeenCalledWith(['createPrescription']);
    });

    it('should return false on canCreatePrescription when user does not have permission', () => {
      createFixture();
      const mockAccessMatrixState = jest.spyOn(
        (component as any).accessMatrixState,
        'hasAtLeastOnePermissionForAnyTemplate'
      );
      mockAccessMatrixState.mockReturnValue(false);

      const result = component.canCreatePrescription();

      expect(result).toBe(false);
    });

    it('should return true on canCreateProposal when user has permission', () => {
      createFixture();
      const mockAccessMatrixState = jest.spyOn(
        (component as any).accessMatrixState,
        'hasAtLeastOnePermissionForAnyTemplate'
      );
      mockAccessMatrixState.mockReturnValue(true);

      const result = component.canCreateProposal();

      expect(result).toBe(true);
      expect(mockAccessMatrixState).toHaveBeenCalledWith(['createProposal']);
    });

    it('should return false on canCreateProposal when user does not have permission', () => {
      createFixture();
      const mockAccessMatrixState = jest.spyOn(
        (component as any).accessMatrixState,
        'hasAtLeastOnePermissionForAnyTemplate'
      );
      mockAccessMatrixState.mockReturnValue(false);

      const result = component.canCreateProposal();

      expect(result).toBe(false);
    });

    it('should reset searchCriteria historical to false', () => {
      createFixture();
      (component as any).searchCriteria$.set({ historical: true });

      component.ngOnDestroy();

      expect((component as any).searchCriteria$()).toEqual({ historical: false });
    });

    it('should set errorCard with correct properties', () => {
      createFixture();
      component.showErrorCard();

      expect(component.errorCard).toEqual({
        show: true,
        message: 'common.somethingWentWrongWithoutRetry',
      });
    });
  });

  const createFixture = () => {
    fixture = TestBed.createComponent(PrescriptionListWebComponent);
    component = fixture.componentInstance;
    component.intent = Intent.ORDER;
    fixture.detectChanges();
  };
});
