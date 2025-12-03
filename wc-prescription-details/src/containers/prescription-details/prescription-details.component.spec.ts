import { PrescriptionDetailsWebComponent } from './prescription-details.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { DateAdapter, MatNativeDateModule } from '@angular/material/core';
import { ConfigurationService } from '@reuse/code/services/config/configuration.service';
import { AuthService } from '@reuse/code/services/auth/auth.service';
import { By } from '@angular/platform-browser';
import { importProvidersFrom, SimpleChanges } from '@angular/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { IdToken, Intent } from '@reuse/code/interfaces';
import { ToastService } from '@reuse/code/services/helpers/toast.service';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { PseudonymisationHelper } from '@smals-belgium-shared/pseudo-helper';
import { PseudoService } from '@reuse/code/services/privacy/pseudo.service';
import { EncryptionState } from '@reuse/code/states/privacy/encryption.state';
import { HttpCacheService } from '@reuse/code/services/cache/http-cache.service';
import {
  MockDateAdapter,
  FakeLoader,
  mockConfigService,
  mockAuthService,
  MockPseudoHelperFactory,
  encryptionStateService,
  prescriptionResponse,
  id,
  BASE_URL,
  mockUuid,
  organisationTask,
  referralTask,
  mockPerformerTask,
  mockPerson,
  mockTemplate,
} from '../../../test.utils';
import { ReadRequestResource } from '@reuse/code/openapi';
import { CancelPrescriptionDialog } from '@reuse/code/dialogs/cancel-prescription/cancel-prescription-dialog.component';
import { Lang } from '@reuse/code/interfaces/lang.enum';
mockUuid();
jest.mock('uuid');

describe('PrescriptionDetailsWebComponent', () => {
  let component: PrescriptionDetailsWebComponent;
  let fixture: ComponentFixture<PrescriptionDetailsWebComponent>;
  let httpMock: HttpTestingController;
  let toaster: ToastService;
  let pseudoService: PseudoService;
  let consoleSpy: jest.SpyInstance;
  let translate: TranslateService;
  let dateAdapter: MockDateAdapter;
  let cacheHttpService: HttpCacheService;
  let dialog: MatDialog;

  beforeAll(() => {
    Object.defineProperty(window, 'crypto', {
      value: {
        subtle: {
          importKey: jest.fn(),
          decrypt: jest.fn(),
          getRandomValues: jest.fn(),
        },
      },
    });
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
        MatDatepickerModule,
        MatNativeDateModule,
        MatDialogModule,
        NoopAnimationsModule,
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        DateAdapter,
        importProvidersFrom(MatNativeDateModule),
        { provide: ConfigurationService, useValue: mockConfigService },
        { provide: AuthService, useValue: mockAuthService },
        MatDialog,
        { provide: PseudonymisationHelper, useValue: MockPseudoHelperFactory() },
        { provide: EncryptionState, useValue: encryptionStateService },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    toaster = TestBed.inject(ToastService);
    pseudoService = TestBed.inject(PseudoService);
    translate = TestBed.inject(TranslateService);
    dateAdapter = TestBed.inject(DateAdapter) as unknown as MockDateAdapter;
    cacheHttpService = TestBed.inject(HttpCacheService);
    dialog = TestBed.inject(MatDialog);
  });

  afterEach(() => {
    httpMock.verify();
  });

  afterAll(() => consoleSpy.mockRestore());

  it('should create the app', () => {
    createFixture();
    expect(component).toBeTruthy();
  });

  it('should show the loading state', () => {
    createFixture();
    component.loading.set(true);
    expect(component.loading()).toBe(true);

    fixture.detectChanges();
    const { debugElement } = fixture;

    const loader = debugElement.query(By.css('app-overlay-spinner'));
    expect(loader).toBeTruthy();
  });

  it('should show a toast message when shortCode is invalid', async () => {
    const toasterSpy = jest.spyOn(toaster, 'show');

    createFixture();

    const mockResponse = prescriptionResponse();
    await loadPrescriptionByShortCode(mockResponse, 'CAF4', '90122712173', false);

    expect(toasterSpy).toHaveBeenCalledTimes(1);
    expect(toasterSpy).toHaveBeenCalledWith('prescription.errors.invalidShortCode');
  });

  it('should show a toast message when ssin is invalid', async () => {
    const toasterSpy = jest.spyOn(toaster, 'show');

    createFixture();

    const mockResponse = prescriptionResponse();
    await loadPrescriptionByShortCode(mockResponse, 'CAF4FE', '90122712166', false);

    expect(toasterSpy).toHaveBeenCalledTimes(1);
    expect(toasterSpy).toHaveBeenCalledWith('prescription.errors.invalidSsinChecksum');
  });

  it('should load a proposals if intent is proposals', () => {
    createFixture();
    component.prescriptionId = id;
    fixture.detectChanges();

    const loadPrescriptionSpy = jest.spyOn(component, 'loadPrescription');
    const loadProposalSpy = jest.spyOn(component, 'loadProposal');

    component.loadPrescriptionOrProposal();

    expect(loadPrescriptionSpy).toHaveBeenCalled();
    httpMock.expectOne(`${BASE_URL}/prescriptions/${id}`);

    component.intent = Intent.PROPOSAL;
    fixture.detectChanges();

    component.loadPrescriptionOrProposal();

    expect(loadProposalSpy).toHaveBeenCalled();
    httpMock.expectOne(`${BASE_URL}/proposals/${id}`);
  });

  it('should request the persons call when user is professional', async () => {
    loadCrypto();
    mockAuthService.isProfessional.mockImplementationOnce(() => of(true));
    createFixture();

    const mockResponse = prescriptionResponse();
    await loadPrescription(mockResponse);

    const req = httpMock.expectOne(`${BASE_URL}/persons/${mockPerson.ssin}`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('should display the error card', () => {
    createFixture();
    mockConfigService.getEnvironmentVariable.mockImplementationOnce(() => false);
    component.prescriptionId = id;
    const changes = {
      prescriptionId: id,
    };

    component.ngOnChanges(changes as unknown as SimpleChanges);
    fixture.detectChanges();

    const req = httpMock.expectOne(`${BASE_URL}/prescriptions/${id}`);
    req.error(new ProgressEvent('error'), { status: 401 });

    fixture.detectChanges();

    const { debugElement } = fixture;
    const errorCard = debugElement.query(By.css('app-alert'));
    expect(errorCard).toBeTruthy();
  });

  it('should load templates and the access matrix when the token changes', () => {
    createFixture();
    jest.spyOn(cacheHttpService, 'loadFromCache').mockReturnValue(of(null));

    mockConfigService.getEnvironmentVariable.mockImplementationOnce(() => false);
    component.services = {
      getAccessToken: () => Promise.resolve('ey...ab'),
      getIdToken: () => ({}) as IdToken,
    };
    const changes = {
      services: component.services,
    };

    component.ngOnChanges(changes as unknown as SimpleChanges);
    fixture.detectChanges();

    const accessReq = httpMock.expectOne(BASE_URL + '/accessMatrix');
    expect(accessReq.request.method).toBe('GET');
    accessReq.flush({});

    const templateReq = httpMock.expectOne(BASE_URL + '/templates');
    expect(templateReq.request.method).toBe('GET');
    templateReq.flush([]);
  });

  describe('language switch', () => {
    it('should initialize language and locale if currentLang is not set', () => {
      translate.currentLang = '';
      const setLocalesSpy = jest.spyOn(dateAdapter, 'setLocale');

      createFixture();

      expect(translate.getDefaultLang()).toBe('fr-BE');
      expect(setLocalesSpy).toHaveBeenCalledWith('fr-BE');
    });

    it('should intialize and call only once setLocale() from dateAdapter', () => {
      translate.use('nl-BE');
      const setLocalesSpy = jest.spyOn(dateAdapter, 'setLocale');

      createFixture();

      expect(setLocalesSpy).toHaveBeenCalledTimes(1);
      expect(setLocalesSpy).toHaveBeenCalledWith(Lang.NL);
    });
  });

  it('should open the cancel prescription dialog when the function is called', () => {
    createFixture();
    const openDialogSpy = jest.spyOn(dialog, 'open');

    const mockResponse = prescriptionResponse([organisationTask], referralTask, [
      mockPerformerTask,
    ]) as unknown as ReadRequestResource;

    component.openCancelPrescriptionDialog(mockResponse, mockPerson);

    const paramsCancel = {
      data: {
        prescription: mockResponse,
        patient: mockPerson,
      },
      panelClass: 'mh-dialog-container',
    };

    expect(openDialogSpy).toHaveBeenCalledTimes(1);
    expect(openDialogSpy).toHaveBeenCalledWith(CancelPrescriptionDialog, paramsCancel);
  });

  const loadPrescriptionByShortCode = async (
    mockResponse: any,
    shortCode: string,
    ssin: string,
    loadRequests: boolean = true
  ) => {
    mockConfigService.getEnvironmentVariable.mockImplementationOnce(() => false);

    component.prescriptionId = shortCode;
    component.patientSsin = ssin;
    const changes = {
      prescriptionId: shortCode,
      patientSsin: ssin,
    };

    component.ngOnChanges(changes as unknown as SimpleChanges);
    fixture.detectChanges();
    await Promise.resolve();

    if (loadRequests) {
      prescriptionByShortCodeRequest(mockResponse, shortCode, ssin);

      fixture.detectChanges();

      templateRequest();
      await Promise.resolve();
    }

    fixture.detectChanges();
  };

  const loadPrescription = async (mockResponse: any) => {
    mockConfigService.getEnvironmentVariable.mockImplementationOnce(() => false);

    component.prescriptionId = id;
    const changes = {
      prescriptionId: id,
    };

    component.ngOnChanges(changes as unknown as SimpleChanges);
    fixture.detectChanges();

    prescriptionRequest(mockResponse);

    fixture.detectChanges();

    await Promise.resolve();

    templateRequest();

    await Promise.resolve();
    fixture.detectChanges();
  };

  const templateRequest = () => {
    const templateRed = httpMock.expectOne(BASE_URL + '/templates/READ_GENERIC/versions/latest');
    expect(templateRed.request.method).toBe('GET');
    templateRed.flush(mockTemplate);
  };

  const prescriptionRequest = (mockResponse: any) => {
    const req = httpMock.expectOne(`${BASE_URL}/prescriptions/${id}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  };

  const prescriptionByShortCodeRequest = (mockResponse: any, shortCode: string, ssin: string) => {
    const req = httpMock.expectOne(BASE_URL + '/prescription?ssin=' + ssin + '&shortCode=' + shortCode);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  };

  const createFixture = () => {
    fixture = TestBed.createComponent(PrescriptionDetailsWebComponent);
    component = fixture.componentInstance;
    component.generatedUUID.set('generate-id');
    expect(component.generatedUUID()).toBe('generate-id');

    fixture.detectChanges();
  };

  const loadCrypto = () => {
    const key = new Uint8Array([1, 2, 3, 4]);
    const promiseUint8Array = Promise.resolve(key);
    jest.spyOn(pseudoService, 'identifyPseudonymInTransit').mockReturnValue(promiseUint8Array);

    const promiseCryptoKey = Promise.resolve({} as CryptoKey);
    jest.spyOn(window.crypto.subtle, 'importKey').mockReturnValue(promiseCryptoKey);
    jest.spyOn(window.crypto.subtle, 'decrypt').mockReturnValue(Promise.resolve(new ArrayBuffer(16)));
  };
});
