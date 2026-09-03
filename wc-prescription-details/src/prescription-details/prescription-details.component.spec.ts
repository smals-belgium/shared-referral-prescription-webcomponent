import { PrescriptionDetailsWebComponent } from './prescription-details.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom, of, throwError } from 'rxjs';
import { DateAdapter, MatNativeDateModule } from '@angular/material/core';
import { ConfigurationService } from '@reuse/code/services/config/configuration.service';
import { AuthService } from '@reuse/code/services/auth/auth.service';
import { By } from '@angular/platform-browser';
import { importProvidersFrom, SimpleChange, SimpleChanges } from '@angular/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { IdToken, Intent } from '@reuse/code/interfaces';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { PseudonymisationHelper } from '@smals-belgium-shared/pseudo-helper';
import { PseudoService } from '@reuse/code/services/privacy/pseudo.service';
import { EncryptionState } from '@reuse/code/states/privacy/encryption.state';
import { EncryptionService } from '@reuse/code/services/privacy/encryption.service';
import {
  BASE_URL,
  encryptionStateService,
  FakeLoader,
  id,
  markdownServiceMock,
  mockAuthService,
  mockConfigService,
  MockDateAdapter,
  mockPerson,
  MockPseudoHelperFactory,
  mockTemplate,
  mockUuid,
  prescriptionResponse,
} from '../../test.utils';
import { TemplateVersion } from '@reuse/code/openapi';
import { Lang } from '@reuse/code/constants/languages';
import { IconRegistryService } from '@reuse/code/services/helpers/icon-registry.service';
import { MarkdownService } from 'ngx-markdown';
import { EvfTranslateService } from '@smals-belgium-shared/vas-evaluation-form-ui-core';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import * as utils from '@reuse/code/utils/utils';
import { AlertService } from '@reuse/code/services/helpers/alert.service';
import { mockTestAlertService } from '@reuse/code/utils/test.utils';
import { ALERT_TARGET, ERROR_PRESCRIPTION_DETAILS } from '@reuse/code/constants/error';

mockUuid();
jest.mock('uuid');

type MockPseudoService = jest.Mocked<
  Pick<PseudoService, 'pseudonymize' | 'identify' | 'pseudonymizeByteArray' | 'identifyByteArray'>
>;

describe('PrescriptionDetailsWebComponent', () => {
  let component: PrescriptionDetailsWebComponent;
  let fixture: ComponentFixture<PrescriptionDetailsWebComponent>;
  let httpMock: HttpTestingController;
  let pseudoService: MockPseudoService;
  let translate: TranslateService;
  let dateAdapter: MockDateAdapter;
  let mockIconRegistryService: jest.Mocked<Partial<IconRegistryService>>;
  let mockAlertService: jest.Mocked<Partial<AlertService>>;
  let mockPseudoService: MockPseudoService;

  beforeAll(() => {
    Object.defineProperty(window, 'crypto', {
      configurable: true,
      value: {
        getRandomValues: jest.fn((array: Uint8Array) => array),
        randomUUID: jest.fn(() => 'mock-alert-target'),
        subtle: {
          importKey: jest.fn(),
          decrypt: jest.fn(),
        },
      },
    });
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    configureMockConfigService();

    mockAuthService.isProfessional.mockReturnValue(of(false));
    (mockAuthService as any).isOrganization?.mockReturnValue(of(false));
    (mockAuthService as any).isPatient?.mockReturnValue?.(of(false));

    mockIconRegistryService = {
      init: jest.fn(),
    };
    mockAlertService = mockTestAlertService;

    mockPseudoService = {
      pseudonymize: jest.fn(async (value: string) => value),
      identify: jest.fn(async (value: string) => value),
      pseudonymizeByteArray: jest.fn(async (_array: Uint8Array<ArrayBufferLike>) => 'pseudonymized-byte-array'),
      identifyByteArray: jest.fn(async (_value: string) => new Uint8Array([1, 2, 3, 4]) as Uint8Array<ArrayBufferLike>),
    };

    pseudoService = mockPseudoService;

    TestBed.configureTestingModule({
      imports: [
        PrescriptionDetailsWebComponent,
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: FakeLoader },
        }),
        MatDatepickerModule,
        MatNativeDateModule,
        MatDialogModule,
        NoopAnimationsModule,
        MatIconTestingModule,
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        importProvidersFrom(MatNativeDateModule),
        { provide: DateAdapter, useClass: MockDateAdapter },
        { provide: ConfigurationService, useValue: mockConfigService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: ALERT_TARGET, useValue: ERROR_PRESCRIPTION_DETAILS },
        MatDialog,
        { provide: PseudonymisationHelper, useValue: MockPseudoHelperFactory() },
        { provide: PseudoService, useValue: mockPseudoService },
        { provide: EncryptionState, useValue: encryptionStateService },
        { provide: IconRegistryService, useValue: mockIconRegistryService },
        EncryptionService,
        { provide: MarkdownService, useValue: markdownServiceMock },
        EvfTranslateService,
        { provide: AlertService, useValue: mockAlertService },
      ],
    });

    TestBed.overrideProvider(PseudoService, { useValue: mockPseudoService });

    TestBed.overrideComponent(PrescriptionDetailsWebComponent, {
      add: {
        providers: [{ provide: PseudoService, useValue: mockPseudoService }],
        viewProviders: [{ provide: PseudoService, useValue: mockPseudoService }],
      },
    });

    await TestBed.compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    pseudoService = mockPseudoService;
    translate = TestBed.inject(TranslateService);
    dateAdapter = TestBed.inject(DateAdapter) as unknown as MockDateAdapter;
  });

  afterEach(() => {
    httpMock.verify();
    jest.restoreAllMocks();
  });

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
    const alertServiceSpy = jest.spyOn(mockAlertService, 'showGeneralError');

    createFixture();

    const mockResponse = prescriptionResponse();
    await loadPrescriptionByShortCode(mockResponse, 'CAF4', '90122712173', false);

    expect(alertServiceSpy).toHaveBeenCalledTimes(1);
    expect(alertServiceSpy).toHaveBeenCalledWith(
      expect.stringMatching(/^prescription-details/),
      'prescription.errors.invalidShortCode'
    );
  });

  it('should show a toast message when ssin is invalid', async () => {
    const alertServiceSpy = jest.spyOn(mockAlertService, 'showGeneralError');

    createFixture();

    const mockResponse = prescriptionResponse();
    await loadPrescriptionByShortCode(mockResponse, 'CAF4FE', '90122712166', false);

    expect(alertServiceSpy).toHaveBeenCalledTimes(1);
    expect(alertServiceSpy).toHaveBeenCalledWith(
      expect.stringMatching(/^prescription-details/),
      'prescription.errors.invalidSsinChecksum'
    );
  });

  it('should load a proposals if intent is proposals', () => {
    createFixture();

    component.prescriptionId = id;
    fixture.detectChanges();

    const loadPrescriptionSpy = jest.spyOn(component, 'loadPrescription');
    const loadProposalSpy = jest.spyOn(component, 'loadProposal');

    component.loadPrescriptionOrProposal();

    expect(loadPrescriptionSpy).toHaveBeenCalled();

    const prescriptionReq = httpMock.expectOne(`${BASE_URL}/prescriptions/${id}`);
    expect(prescriptionReq.request.method).toBe('GET');
    prescriptionReq.flush(null);

    component.intent = Intent.PROPOSAL;
    fixture.detectChanges();

    component.loadPrescriptionOrProposal();

    expect(loadProposalSpy).toHaveBeenCalled();

    const proposalReq = httpMock.expectOne(`${BASE_URL}/proposals/${id}`);
    expect(proposalReq.request.method).toBe('GET');
    proposalReq.flush(null);
  });

  it('should request the persons call when user is professional', async () => {
    loadCrypto();

    mockAuthService.isProfessional.mockReturnValue(of(true));
    configureMockConfigService();

    createFixture();

    component.prescriptionId = id;

    component.ngOnChanges(
      makeChanges({
        prescriptionId: { previous: undefined, current: id },
      })
    );

    fixture.detectChanges();
    await fixture.whenStable();

    prescriptionRequest(prescriptionResponse());

    fixture.detectChanges();
    await fixture.whenStable();

    templateRequest();

    fixture.detectChanges();
    await fixture.whenStable();

    const personReq = httpMock.expectOne(`${BASE_URL}/persons/${mockPerson.ssin}`);
    expect(personReq.request.method).toBe('GET');
    personReq.flush({});

    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should request the persons call when user is organization', async () => {
    loadCrypto();

    (mockAuthService as any).isOrganization?.mockReturnValue(of(true));
    configureMockConfigService();

    createFixture();

    const mockResponse = prescriptionResponse();

    await loadPrescription(mockResponse);

    const req = httpMock.expectOne(`${BASE_URL}/persons/${mockPerson.ssin}`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('should display the error card', async () => {
    createFixture();

    configureMockConfigService();
    component.prescriptionId = id;

    component.ngOnChanges(
      makeChanges({
        prescriptionId: { previous: undefined, current: id },
      })
    );

    fixture.detectChanges();
    await fixture.whenStable();

    const req = httpMock.expectOne(`${BASE_URL}/prescriptions/${id}`);
    req.error(new ProgressEvent('error'), { status: 401 });

    fixture.detectChanges();
    await fixture.whenStable();

    const { debugElement } = fixture;
    const errorCard = debugElement.query(By.css('app-alert'));

    expect(errorCard).toBeTruthy();
  });

  it('should load templates and the access matrix when the token changes', async () => {
    createFixture();

    configureMockConfigService();

    component.services = {
      getAccessToken: () => Promise.resolve('ey...ab'),
      getIdToken: () => ({}) as IdToken,
    };

    component.ngOnChanges(
      makeChanges({
        services: { previous: undefined, current: component.services },
      })
    );

    fixture.detectChanges();
    await fixture.whenStable();

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

      const setLocaleSpy = jest.spyOn(dateAdapter, 'setLocale');

      createFixture();

      expect(translate.getDefaultLang()).toBe(Lang.FR.full);
      expect(setLocaleSpy).toHaveBeenCalledWith(Lang.FR.full);
    });

    it('should initialize and call only once setLocale() from dateAdapter', () => {
      translate.use(Lang.NL.full);

      const setLocaleSpy = jest.spyOn(dateAdapter, 'setLocale');

      createFixture();

      expect(setLocaleSpy).toHaveBeenCalledTimes(1);
      expect(setLocaleSpy).toHaveBeenCalledWith(Lang.NL.full);
    });
  });

  it('should show error toast when patientSsin is invalid for proposal', () => {
    createFixture();

    const alertServiceSpy = jest.spyOn(mockAlertService, 'showGeneralError');

    component.prescriptionId = 'INVALID';
    component.patientSsin = '90122712173';

    component.loadProposal();

    expect(alertServiceSpy).toHaveBeenCalledWith(
      expect.stringMatching(/^prescription-details/),
      'proposals.errors.invalidUUID'
    );
  });

  it('should load crypto key when pseudonymizedKey is valid', async () => {
    createFixture();

    const uint8Array = new Uint8Array([1, 2, 3, 4]);

    jest.spyOn(pseudoService, 'identifyByteArray').mockResolvedValue(uint8Array);

    const loadCryptoKeySpy = jest.spyOn(component['_encryptionStateService'], 'loadCryptoKey');

    await component.getPrescriptionKey('valid-key');

    expect(loadCryptoKeySpy).toHaveBeenCalledWith(uint8Array);
  });

  it('should set crypto key error when getPrescriptionKey throws error', async () => {
    createFixture();

    jest.spyOn(pseudoService, 'identifyByteArray').mockImplementation(() => {
      throw new Error('Invalid key');
    });

    const setCryptoKeyErrorSpy = jest.spyOn(component['_encryptionStateService'], 'setCryptoKeyError');

    await component.getPrescriptionKey('invalid-key');

    expect(setCryptoKeyErrorSpy).toHaveBeenCalled();
  });

  it('should decrypt responses when elements are not encrypted', async () => {
    createFixture();

    const responses = { field1: 'value1', field2: 'value2' };
    const template = {
      elements: [
        { id: 'field1', tags: [] },
        { id: 'field2', tags: [] },
      ],
    };

    const result = await firstValueFrom(component['decryptResponses'](responses, template as any));

    expect(result).toEqual({ field1: 'value1', field2: 'value2' });
  });

  it('should decrypt freeText elements when crypto key is provided', async () => {
    createFixture();

    const responses = { note: 'encrypted-value' };
    const template = {
      elements: [{ id: 'note', tags: ['freeText'] }],
    };
    const cryptoKey = {} as CryptoKey;

    const encryptionService = TestBed.inject(EncryptionService);
    jest.spyOn(encryptionService, 'decryptText').mockReturnValue(of('decrypted-value'));

    const result = await firstValueFrom(component['decryptResponses'](responses, template as any, cryptoKey));

    expect(result).toEqual({ note: 'decrypted-value' });
  });

  it('should throw error when freeText element but no crypto key', async () => {
    createFixture();

    const responses = { note: 'encrypted-value' };
    const template = {
      elements: [{ id: 'note', tags: ['freeText'] }],
    };

    await expect(firstValueFrom(component['decryptResponses'](responses, template as any, undefined))).rejects.toThrow(
      'Pseudo key is missing'
    );
  });

  it('should handle decryption errors gracefully', async () => {
    createFixture();

    const responses = { note: 'encrypted-value' };
    const template = {
      elements: [{ id: 'note', tags: ['freeText'] }],
    };
    const cryptoKey = {} as CryptoKey;

    const encryptionService = TestBed.inject(EncryptionService);
    jest.spyOn(encryptionService, 'decryptText').mockReturnValue(throwError(() => new Error('Decryption failed')));

    await expect(firstValueFrom(component['decryptResponses'](responses, template as any, cryptoKey))).rejects.toThrow(
      'Decryption failed'
    );
  });

  it('should call loadPssStatus for ANNEX_82', () => {
    createFixture();

    const mockStatus = true;

    jest.spyOn(component['_pssService'], 'getPssStatus').mockReturnValue(of(mockStatus));

    const pssStatusSetSpy = jest.spyOn(component['_prescriptionSecondaryService'].pssStatus, 'set');

    component['loadPssStatus']('ANNEX_82');

    expect(pssStatusSetSpy).toHaveBeenCalledWith(mockStatus);
  });

  it('should call loadPrescriptionByShortCode when conditions are met', async () => {
    createFixture();

    component.prescriptionId = 'CAF4FE';
    component.patientSsin = '90122712173';

    jest.spyOn(pseudoService, 'pseudonymize').mockResolvedValue('pseudonymized-identifier');

    const loadSpy = jest
      .spyOn(component['_prescriptionStateService'], 'loadPrescriptionByShortCode')
      .mockImplementation(() => {});

    component['loadPrescription']();

    await fixture.whenStable();

    expect(loadSpy).toHaveBeenCalledWith('CAF4FE', 'pseudonymized-identifier');
  });

  describe('init icons', () => {
    it('should register icons onInit', () => {
      createFixture();

      component.ngOnInit();

      expect(mockIconRegistryService.init).toHaveBeenCalledWith(
        'keyboard_arrow_up',
        'keyboard_arrow_down',
        'more_vert',
        'delete',
        'error',
        'done',
        'close',
        'cancel',
        'arrow_forward_ios',
        'info',
        'person',
        'warning',
        'tune',
        'apartment'
      );
    });
  });

  describe('populate infoElements', () => {
    it('populates infoElements only with viewType info and resets infoElements on each new prescription load', async () => {
      const elements = [
        { id: '1', viewType: 'info', label: 'Info element' },
        { id: '2', viewType: 'input', label: 'Input element' },
        { id: '3', viewType: 'info', label: 'Another info' },
      ];

      const templateRequestBody = {
        elements,
        version: '',
        templateId: 0,
      };

      const mockResponse = prescriptionResponse();

      createFixture();

      await loadPrescription(mockResponse, templateRequestBody);

      expect(component.infoElements).toHaveLength(2);
      expect(component.infoElements.every(e => e.viewType === 'info')).toBe(true);

      const templateRequestBody2 = {
        elements: [],
        version: '',
        templateId: 0,
      };

      await loadPrescription(mockResponse, templateRequestBody2);

      expect(component.infoElements).toHaveLength(0);
    });
  });

  describe('prescription/ssin change handling', () => {
    it('resets crypto key and loads when prescriptionId changes to a valid ID', () => {
      createFixture();

      const loadSpy = jest.spyOn(component, 'loadPrescriptionOrProposal').mockImplementation(() => {});
      jest.spyOn(utils, 'isPrescriptionId').mockReturnValue(true);

      const prescriptionId = 'VALID-ID-123';
      component.prescriptionId = prescriptionId;

      component.ngOnChanges(
        makeChanges({
          prescriptionId: { previous: undefined, current: prescriptionId },
        })
      );

      expect(encryptionStateService.resetCryptoKey).toHaveBeenCalledTimes(1);
      expect(loadSpy).toHaveBeenCalledTimes(1);
    });

    it('resets crypto key and loads when patientSsin changes and prescriptionId is not a full valid ID', () => {
      createFixture();

      const loadSpy = jest.spyOn(component, 'loadPrescriptionOrProposal').mockImplementation(() => {});

      jest.spyOn(utils, 'isPrescriptionId').mockReturnValue(false);
      jest.spyOn(utils, 'isPrescriptionShortCode').mockReturnValue(false);

      component.prescriptionId = 'SHORT';
      component.patientSsin = '12345678901';

      component.ngOnChanges(
        makeChanges({
          patientSsin: { previous: undefined, current: '12345678901' },
        })
      );

      expect(encryptionStateService.resetCryptoKey).toHaveBeenCalledTimes(1);
      expect(loadSpy).toHaveBeenCalledTimes(1);
    });

    it('does NOT reset or load when patientSsin changes but prescriptionId is already a valid full ID', () => {
      createFixture();

      const loadSpy = jest.spyOn(component, 'loadPrescriptionOrProposal').mockImplementation(() => {});
      jest.spyOn(utils, 'isPrescriptionId').mockReturnValue(true);

      component.prescriptionId = 'VALID-ID-123';
      component.patientSsin = '12345678901';

      component.ngOnChanges(
        makeChanges({
          patientSsin: { previous: undefined, current: '12345678901' },
        })
      );

      expect(encryptionStateService.resetCryptoKey).not.toHaveBeenCalled();
      expect(loadSpy).not.toHaveBeenCalled();
    });
  });

  const change = (previous: unknown, current: unknown, firstChange = false): SimpleChange =>
    new SimpleChange(previous, current, firstChange);

  const makeChanges = (
    changes: Record<string, { previous?: unknown; current: unknown; firstChange?: boolean }>
  ): SimpleChanges =>
    Object.entries(changes).reduce((acc, [key, value]) => {
      acc[key] = change(value.previous, value.current, value.firstChange ?? false);
      return acc;
    }, {} as SimpleChanges);

  const configureMockConfigService = () => {
    mockConfigService.getEnvironment.mockReturnValue('test');

    mockConfigService.getEnvironmentVariable.mockImplementation((key: string) => {
      switch (key) {
        case 'pseudoApiUrl':
          return 'https://pseudo-api.test';

        case 'enablePseudo':
          return false;

        default:
          return false;
      }
    });
  };

  const loadPrescriptionByShortCode = async (
    mockResponse: any,
    shortCode: string,
    ssin: string,
    loadRequests: boolean = true
  ) => {
    configureMockConfigService();

    component.prescriptionId = shortCode;
    component.patientSsin = ssin;

    component.ngOnChanges(
      makeChanges({
        prescriptionId: { previous: undefined, current: shortCode },
        patientSsin: { previous: undefined, current: ssin },
      })
    );

    fixture.detectChanges();
    await fixture.whenStable();

    if (loadRequests) {
      prescriptionByShortCodeRequest(mockResponse, shortCode, ssin);

      fixture.detectChanges();
      await fixture.whenStable();

      templateRequest();

      await fixture.whenStable();
    }

    fixture.detectChanges();
  };

  const loadPrescription = async (mockResponse: any, template: TemplateVersion = mockTemplate) => {
    configureMockConfigService();

    component.prescriptionId = id;

    component.ngOnChanges(
      makeChanges({
        prescriptionId: { previous: undefined, current: id },
      })
    );

    fixture.detectChanges();
    await fixture.whenStable();

    prescriptionRequest(mockResponse);

    fixture.detectChanges();
    await fixture.whenStable();

    templateRequest(template);

    await fixture.whenStable();
    fixture.detectChanges();
  };

  const templateRequest = (template: TemplateVersion = mockTemplate) => {
    const templateReq = httpMock.expectOne(BASE_URL + '/templates/READ_GENERIC/versions/latest');

    expect(templateReq.request.method).toBe('GET');

    templateReq.flush(template);
  };

  const prescriptionRequest = (mockResponse: any, prescriptionId: string = id) => {
    const req = httpMock.expectOne(`${BASE_URL}/prescriptions/${prescriptionId}`);

    expect(req.request.method).toBe('GET');

    req.flush(mockResponse);
  };

  const prescriptionByShortCodeRequest = (mockResponse: any, shortCode: string, ssin: string) => {
    const req = httpMock.expectOne(BASE_URL + '/prescription?ssin=' + ssin + '&shortCode=' + shortCode);

    expect(req.request.method).toBe('GET');

    req.flush(mockResponse);
  };

  const createFixture = ({
    prescriptionId = id,
    intent = 'order',
    services = {
      getAccessToken: () => Promise.resolve('mock-token'),
      getIdToken: () => ({}) as any,
    },
  }: {
    prescriptionId?: string;
    intent?: string;
    services?: any;
  } = {}) => {
    fixture = TestBed.createComponent(PrescriptionDetailsWebComponent);
    component = fixture.componentInstance;

    component.prescriptionId = prescriptionId;
    component.intent = intent;
    component.services = services;

    component.generatedUUID.set('generate-id');

    expect(component.generatedUUID()).toBe('generate-id');

    fixture.detectChanges();
  };

  const loadCrypto = () => {
    const key = new Uint8Array([1, 2, 3, 4]);
    const promiseUint8Array = Promise.resolve(key);

    pseudoService.identifyByteArray.mockReturnValue(promiseUint8Array);

    const promiseCryptoKey = Promise.resolve({} as CryptoKey);

    jest.spyOn(globalThis.crypto.subtle, 'importKey').mockReturnValue(promiseCryptoKey);
    jest.spyOn(globalThis.crypto.subtle, 'decrypt').mockReturnValue(Promise.resolve(new ArrayBuffer(16)));
  };
});
