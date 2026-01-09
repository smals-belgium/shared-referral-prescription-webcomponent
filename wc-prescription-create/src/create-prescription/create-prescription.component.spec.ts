import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter } from '@angular/material/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { signal, SimpleChange, SimpleChanges } from '@angular/core';
import { ConfigurationService } from '@reuse/code/services/config/configuration.service';
import { AuthService } from '@reuse/code/services/auth/auth.service';
import { Observable, of, throwError } from 'rxjs';
import { ElementGroup, EvfTranslateService } from '@smals/vas-evaluation-form-ui-core';
import {
  CreatePrescriptionForm,
  CreatePrescriptionInitialValues,
  Intent,
  LoadingStatus,
  UserProfile,
} from '@reuse/code/interfaces';
import { EncryptionService } from '@reuse/code/services/privacy/encryption.service';
import { PseudonymisationHelper } from '@smals-belgium-shared/pseudo-helper';
import { CreatePrescriptionExtendedWebComponent } from './create-prescription-extended.component';
import { By } from '@angular/platform-browser';
import { ConfirmDialog } from '@reuse/code/dialogs/confirm/confirm.dialog';
import { ToastService } from '@reuse/code/services/helpers/toast.service';
import { CancelCreationDialog } from '@reuse/code/dialogs/cancel-creation/cancel-creation.dialog';
import { Discipline, PersonResource, ReadRequestResource, ReferralTaskResource, Role } from '@reuse/code/openapi';
import { HttpCacheService } from '@reuse/code/services/cache/http-cache.service';
import { PssService } from '@reuse/code/services/api/pss.service';
import { EncryptionKeyInitializerService } from '@reuse/code/states/privacy/encryption-key-initializer.service';
import { PseudoService } from '@reuse/code/services/privacy/pseudo.service';
import { v4 as uuidv4 } from 'uuid';
import { ShadowDomOverlayContainer } from '@reuse/code/containers/shadow-dom-overlay/shadow-dom-overlay.container';
import { BreakpointObserver } from '@angular/cdk/layout';

jest.spyOn(MatDialog.prototype, 'open').mockImplementation(
  () =>
    ({
      afterClosed: () => of(null),
      beforeClosed: () => of(null),
    }) as any
);

class FakeLoader implements TranslateLoader {
  getTranslation(lang: string): Observable<any> {
    return of({});
  }
}

const mockConfigService = {
  getEnvironment: jest.fn(),
  getEnvironmentVariable: jest.fn(),
};

const mockEncryptionService = {
  generateKey: () => 'cryptoKey',
  exportKey: () => new ArrayBuffer(16),
  encryptText: jest.fn(),
};

const mockEncryptionKeyInitializerService = {
  getCryptoKey: jest.fn(),
  getPseudonymizedKey: jest.fn(),
  initialize: jest.fn(),
};

const mockPersonResource = {
  ssin: '90122712173',
  name: 'name of patient',
} as unknown as UserProfile;

const mockAuthService = {
  init: jest.fn(),
  getClaims: jest.fn(() =>
    of({
      userProfile: mockPersonResource,
    })
  ),
  isProfessional: jest.fn(() => of(false)),
  discipline: jest.fn(() => of(Discipline.Physician)),
  getAccessToken: jest.fn(() => of('')),
  role: jest.fn(() => of(Role.Prescriber)),
} as jest.Mocked<AuthService>;

const mockPssService = {
  getPssStatus: jest.fn(),
  setStatus: jest.fn(),
  getPssSessionId: jest.fn().mockReturnValue('fake-session-id'),
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

// Mock the 'uuid' module
jest.mock('uuid', () => ({
  v4: jest.fn(),
}));

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

const BASE_URL = 'http://localhost';

describe('CreatePrescriptionWebComponent', () => {
  let component: CreatePrescriptionExtendedWebComponent;
  let fixture: ComponentFixture<CreatePrescriptionExtendedWebComponent>;
  let httpMock: HttpTestingController;
  let pseudoService: PseudoService;
  let dialog: MatDialog;
  let toaster: ToastService;
  let translate: TranslateService;
  let dateAdapter: MockDateAdapter;
  let cacheHttpService: HttpCacheService;

  beforeAll(() => {
    Object.defineProperty(window, 'crypto', {
      value: {
        subtle: {
          importKey: jest.fn(), // Mock the `importKey` function
          decrypt: jest.fn(),
          getRandomValues: jest.fn(),
        },
      },
    });
  });

  beforeEach(async () => {
    jest.spyOn(MatDialog.prototype, 'open').mockImplementation(
      () =>
        ({
          afterClosed: () => of(null),
          beforeClosed: () => of(null),
        }) as any
    );
    jest.spyOn(ToastService.prototype, 'show').mockImplementation((message: string) => {});

    await TestBed.configureTestingModule({
      imports: [
        CreatePrescriptionExtendedWebComponent,
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: FakeLoader },
        }),
        MatDatepickerModule,
        MatDialogModule,
        NoopAnimationsModule,
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: DateAdapter, useClass: MockDateAdapter },
        { provide: ConfigurationService, useValue: mockConfigService },
        { provide: AuthService, useValue: mockAuthService },
        MatDialog,
        {
          provide: PseudonymisationHelper,
          useValue: MockPseudoHelperFactory(),
        },
        { provide: EncryptionService, useValue: mockEncryptionService },
        {
          provide: EncryptionKeyInitializerService,
          useValue: mockEncryptionKeyInitializerService,
        },
        { provide: PssService, useValue: mockPssService },
        { provide: ShadowDomOverlayContainer, useValue: mockShadowDomOverlayContainer },
        {
          provide: BreakpointObserver,
          useValue: {
            observe: jest.fn().mockReturnValue(of({ matches: true })),
          },
        },
        EvfTranslateService,
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    pseudoService = TestBed.inject(PseudoService);
    dialog = TestBed.inject(MatDialog);
    toaster = TestBed.inject(ToastService);
    translate = TestBed.inject(TranslateService);
    dateAdapter = TestBed.inject(DateAdapter) as unknown as MockDateAdapter;
    cacheHttpService = TestBed.inject(HttpCacheService);
  });

  afterEach(() => {
    httpMock.verify();
    jest.restoreAllMocks();
  });

  it('should create the app', () => {
    createFixture('mockPseudomizedKey');
    expect(component).toBeTruthy();
  });

  describe('intent switch', () => {
    it('should set displaySelectDialog to true and loading to false when no intent is provided', () => {
      createFixture('mockPseudomizedKey');

      fixture = TestBed.createComponent(CreatePrescriptionExtendedWebComponent);
      component = fixture.componentInstance;
      (component as any).isEnabled$ = of(true);
      component.initialValues = {} as CreatePrescriptionInitialValues;
      fixture.detectChanges();

      const initialValues = { intent: null };
      const changes = {
        initialValues: new SimpleChange(null, initialValues, true),
      };

      component.ngOnChanges(changes);

      expect(component.loading()).toBe(false);
      expect(component.displaySelectDialog$()).toBe(true);
    });

    it('should set loading to true and call handlePrescriptionChanges when intent exists without ANNEX_82', () => {
      createFixture('mockPseudomizedKey');
      const initialValues = {
        intent: 'order',
        initialPrescription: { templateCode: 'TEST' },
        initialPrescriptionType: 'TEST',
      };
      component.initialValues = initialValues;
      const changes = {
        initialValues: new SimpleChange(null, initialValues, true),
      };
      const changeSpy = jest.spyOn(component as any, 'handlePrescriptionChanges').mockImplementation(() => {});

      component.ngOnChanges(changes);

      expect(component.loading()).toBe(true);
      expect(component.displaySelectDialog$()).toBe(false);
      expect(changeSpy).toHaveBeenCalled();
    });
  });

  describe('Publish prescriptions', () => {
    it('should call publishOnePrescription when one prescription form is present and valid', fakeAsync(() => {
      createFixture('mockPseudomizedKey');

      //1 form
      setOnePrescription();

      const mockUpdate = jest.fn(updateFn => updateFn([{ submitted: true }]));
      jest.spyOn(component.prescriptionForms, 'update').mockImplementation(mockUpdate);

      jest.spyOn(component['prescriptionService'], 'create').mockReturnValue(of({ id: '123' }));
      const emitPrescriptionCreated = jest.spyOn(component.prescriptionsCreated, 'emit');

      const mockPublish = jest.spyOn(component, 'publishPrescriptions');
      const mockPublishOnePrescription = jest.spyOn(component as any, 'publishOnePrescriptionOrProposal');
      jest.spyOn(component['encryptionKeyInitializer'], 'initialize').mockReturnValue(of(undefined));

      component.publishPrescriptions();

      expect(mockPublish).toHaveBeenCalled();
      expect(mockPublishOnePrescription).toHaveBeenCalled();

      expect(emitPrescriptionCreated).toHaveBeenCalledWith(['123']);
    }));
    it('should call publishMultiplePrescriptions when more then one prescription form is present and valid', fakeAsync(() => {
      createFixture('mockPseudomizedKey');

      //2 forms
      setMultiplePrescriptions();

      const mockUpdate = jest.fn(updateFn => updateFn([{ submitted: true }]));
      jest.spyOn(component.prescriptionForms, 'update').mockImplementation(mockUpdate);

      jest.spyOn(component['prescriptionService'], 'create').mockReturnValue(of());

      const mockPublish = jest.spyOn(component, 'publishPrescriptions');
      const mockPublishMultiplePrescriptions = jest.spyOn(component as any, 'publishMultiplePrescriptionsOrProposals');

      component.publishPrescriptions();

      expect(mockPublish).toHaveBeenCalled();
      expect(mockPublishMultiplePrescriptions).toHaveBeenCalled();
    }));
  });

  describe('dialog management', () => {
    it('should open the dialog when addPrescription is called', () => {
      createFixture('mockPseudomizedKey');
      const openDialogSpy = jest.spyOn(dialog, 'open');
      const dialogRefMock = {
        beforeClosed: jest.fn().mockReturnValue(of(null)),
      };
      openDialogSpy.mockReturnValue(dialogRefMock as any);

      component.addPrescription();

      expect(dialog.open).toHaveBeenCalled();
    });

    it('should call findModelById when result has modelId and templateCode', fakeAsync(() => {
      createFixture('mockPseudomizedKey');

      const mockResult = {
        templateCode: 'TEMPLATE_001',
        model: { id: 42 },
      };

      const openDialogSpy = jest.spyOn(component['dialog'], 'open');
      const dialogRefMock = {
        beforeClosed: jest.fn().mockReturnValue(of(mockResult)),
      };
      openDialogSpy.mockReturnValue(dialogRefMock as any);

      const findModelByIdSpy = jest.spyOn(component as any, 'findModelById').mockImplementation(() => {});

      (component as any).addPrescription();
      tick();

      expect(findModelByIdSpy).toHaveBeenCalledWith('TEMPLATE_001', 42);
      expect(findModelByIdSpy).toHaveBeenCalledTimes(1);
    }));

    it('should NOT open the dialog when addPrescription is called and discipline is Nurse', async () => {
      createFixture('mockPseudomizedKey');
      const openDialogSpy = jest.spyOn(dialog, 'open');
      const addPrescriptionFormSpy = jest.spyOn(component as any, 'addPrescriptionForm');
      jest.spyOn(cacheHttpService, 'loadFromCache').mockReturnValue(of(null));
      jest.spyOn(component as any, 'isNurse').mockResolvedValue(true);

      component.openSelectDialog();
      await Promise.resolve();

      expect(openDialogSpy).not.toHaveBeenCalled();
      expect(addPrescriptionFormSpy).toHaveBeenCalledWith('ANNEX_81');

      getTemplate('ANNEX_81');
    });

    it('should open the confirmation dialog with correct data', () => {
      createFixture('mockPseudomizedKey');
      const openDialogSpy = jest.spyOn(dialog, 'open');
      const form: CreatePrescriptionForm = {} as any;
      const templateName = 'Test Template';
      const dialogRefMock = {
        beforeClosed: jest.fn().mockReturnValue(of(false)),
      };
      openDialogSpy.mockReturnValue(dialogRefMock as any);

      component.deletePrescriptionForm({ form, templateName });

      expect(openDialogSpy).toHaveBeenCalledWith(ConfirmDialog, {
        data: {
          titleLabel: 'prescription.create.deletePrescription.title',
          messageLabel: 'prescription.create.deletePrescription.message',
          cancelLabel: 'common.cancel',
          okLabel: 'common.delete',
          params: { templateName },
        },
        panelClass: 'mh-dialog-container',
      });
    });
    it('should open CancelCreationDialog when prescriptionForms length is greater than 1', () => {
      createFixture('mockPseudomizedKey');
      setMultiplePrescriptions();

      const openDialogSpy = jest.spyOn(dialog, 'open');
      const dialogRefMock = {
        beforeClosed: jest.fn().mockReturnValue(of({ formsToDelete: [1] })),
      } as unknown as MatDialogRef<unknown, unknown>;
      openDialogSpy.mockReturnValue(dialogRefMock);

      component.cancelCreation();

      expect(openDialogSpy).toHaveBeenCalledWith(CancelCreationDialog, {
        data: {
          prescriptionForms: component.prescriptionForms(),
        },
        panelClass: 'mh-dialog-container',
      });
    });
    it('should open ConfirmDialog and emit clickCancel when prescriptionForms length is 1', () => {
      createFixture('mockPseudomizedKey');
      const componentClickCancelEmitSpy = jest.spyOn(component.clickCancel, 'emit');

      const openDialogSpy = jest.spyOn(dialog, 'open');
      setOnePrescription();

      const dialogRefMock = {
        beforeClosed: jest.fn().mockReturnValue(of(true)),
      } as unknown as MatDialogRef<unknown, unknown>;
      openDialogSpy.mockReturnValue(dialogRefMock);

      component.cancelCreation();

      expect(openDialogSpy).toHaveBeenCalledWith(ConfirmDialog, {
        data: {
          messageLabel: 'prescription.create.cancelCreation',
          cancelLabel: 'common.close',
          okLabel: 'common.confirm',
        },
        panelClass: 'mh-dialog-container',
      });
      expect(componentClickCancelEmitSpy).toHaveBeenCalled();
    });
  });

  describe('form creation and validation', () => {
    it('should display a form', () => {
      createFixture('mockPseudomizedKey');
      const ssin = 'ssin';
      const person: PersonResource = {
        ssin: ssin,
      };

      const { debugElement } = fixture;
      let createMultiplePrescriptionsComponent = debugElement.query(By.css('app-create-multiple-prescriptions'));

      //no patient loaded => no form
      expect(component.patientState$()).toStrictEqual({
        status: LoadingStatus.INITIAL,
      });
      expect(createMultiplePrescriptionsComponent).toBeNull();

      //load patient => display form
      jest.spyOn(component['patientStateService'], 'state').mockReturnValue({
        data: person,
        status: LoadingStatus.SUCCESS,
      });

      const simpleChanges: SimpleChanges = {
        patientSsin: new SimpleChange('', ssin, true),
      };
      component.patientSsin = ssin;
      component.ngOnChanges(simpleChanges);

      getPatient(ssin, person);

      expect(component.patientState$()).toStrictEqual({
        data: person,
        params: undefined,
        status: LoadingStatus.SUCCESS,
      });

      fixture.detectChanges();
      createMultiplePrescriptionsComponent = debugElement.query(
        By.css('app-create-multiple-prescriptions')
      ).nativeElement;
      expect(createMultiplePrescriptionsComponent).toBeTruthy();
    });
    it('should call addPrescriptionForm when a valid templateCode is returned', () => {
      createFixture('mockPseudomizedKey');
      const openDialogSpy = jest.spyOn(dialog, 'open');
      const templateCode = '123ABC';
      const dialogRefMock = { beforeClosed: jest.fn().mockReturnValue(of({ templateCode })) };
      openDialogSpy.mockReturnValue(dialogRefMock as any);

      const addPrescriptionFormMock = jest.spyOn(component as any, 'addPrescriptionForm');
      jest.spyOn(cacheHttpService, 'loadFromCache').mockReturnValue(of(null));

      component.addPrescription();

      expect(addPrescriptionFormMock).toHaveBeenCalledWith(templateCode);

      getTemplate(templateCode);
    });
    it('should not call addPrescriptionForm when result is null', () => {
      createFixture('mockPseudomizedKey');
      const openDialogSpy = jest.spyOn(dialog, 'open');

      const dialogRefMock = {
        beforeClosed: jest.fn().mockReturnValue(of(null)),
      };
      openDialogSpy.mockReturnValue(dialogRefMock as any);

      const addPrescriptionFormMock = jest.spyOn(component as any, 'addPrescriptionForm');

      component.addPrescription();

      expect(addPrescriptionFormMock).not.toHaveBeenCalled();
    });
  });

  describe('form deletion', () => {
    it('should not delete the form if user cancels (false)', () => {
      createFixture('mockPseudomizedKey');
      const openDialogSpy = jest.spyOn(dialog, 'open');
      const prescriptionFormUpdateSpy = jest.spyOn(component.prescriptionForms, 'update');
      const form: CreatePrescriptionForm = {} as any;
      const templateName = 'Test Template';
      const dialogRefMock = {
        beforeClosed: jest.fn().mockReturnValue(of(false)),
      };
      openDialogSpy.mockReturnValue(dialogRefMock as any);

      component.deletePrescriptionForm({ form, templateName });

      expect(prescriptionFormUpdateSpy).not.toHaveBeenCalled();
    });
    it('should delete the form if user confirms (true)', () => {
      createFixture('mockPseudomizedKey');
      const openDialogSpy = jest.spyOn(dialog, 'open');
      const prescriptionFormUpdateSpy = jest.spyOn(component.prescriptionForms, 'update');
      const form: CreatePrescriptionForm = {} as any;
      const templateName = 'Test Template';
      const dialogRefMock = {
        beforeClosed: jest.fn().mockReturnValue(of(true)),
      };
      openDialogSpy.mockReturnValue(dialogRefMock as any);

      component.deletePrescriptionForm({ form, templateName });

      expect(prescriptionFormUpdateSpy).toHaveBeenCalledWith(expect.any(Function));
    });
    it('should remove the correct form when user confirms', () => {
      createFixture('mockPseudomizedKey');
      const openDialogSpy = jest.spyOn(dialog, 'open');
      const form1: CreatePrescriptionForm = { id: '1' } as any;
      const form2: CreatePrescriptionForm = { id: '2' } as any;
      const templateName = 'Test Template';
      const dialogRefMock = {
        beforeClosed: jest.fn().mockReturnValue(of(true)),
      };
      openDialogSpy.mockReturnValue(dialogRefMock as any);

      const mockUpdateFunction = jest.fn(callback => {
        const updatedForms = callback([form1, form2]);
        expect(updatedForms).toEqual([form2]); // Expect form1 to be deleted
      });

      component.prescriptionForms.update = mockUpdateFunction;

      component.deletePrescriptionForm({ form: form1, templateName });

      expect(mockUpdateFunction).toHaveBeenCalled();
    });
    it('should emit clickCancel when all forms are deleted in CancelCreationDialog', () => {
      createFixture('mockPseudomizedKey');
      setMultiplePrescriptions();

      const componentClickCancelEmit = jest.spyOn(component.clickCancel, 'emit');

      const openDialogSpy = jest.spyOn(dialog, 'open');
      const dialogRefMock = {
        beforeClosed: jest.fn().mockReturnValue(of({ formsToDelete: [1, 2] })),
      } as unknown as MatDialogRef<unknown, unknown>;
      openDialogSpy.mockReturnValue(dialogRefMock);

      component.cancelCreation();

      expect(openDialogSpy).toHaveBeenCalled();
      expect(componentClickCancelEmit).toHaveBeenCalled();
    });
    it('should update prescriptionForms when some forms are deleted in CancelCreationDialog', () => {
      createFixture('mockPseudomizedKey');
      setMultiplePrescriptions();

      const componentPrescriptionFormsUpdate = jest.spyOn(component.prescriptionForms, 'update');
      const openDialogSpy = jest.spyOn(dialog, 'open');
      const dialogRefMock = {
        beforeClosed: jest.fn().mockReturnValue(of({ formsToDelete: [1] })),
      } as unknown as MatDialogRef<unknown, unknown>;
      openDialogSpy.mockReturnValue(dialogRefMock);

      component.cancelCreation();

      expect(openDialogSpy).toHaveBeenCalled();
      expect(componentPrescriptionFormsUpdate).toHaveBeenCalledWith(expect.any(Function));
    });
    it('should not perform any action when no forms are deleted in CancelCreationDialog', () => {
      createFixture('mockPseudomizedKey');
      setMultiplePrescriptions();
      const componentClickCancelEmitSpy = jest.spyOn(component.clickCancel, 'emit');
      const componentPrescriptionFormsUpdateSpy = jest.spyOn(component.prescriptionForms, 'update');
      const openDialogSpy = jest.spyOn(dialog, 'open');
      const dialogRefMock = {
        beforeClosed: jest.fn().mockReturnValue(of({ formsToDelete: [] })),
      } as unknown as MatDialogRef<unknown, unknown>;
      openDialogSpy.mockReturnValue(dialogRefMock);

      component.cancelCreation();

      expect(openDialogSpy).toHaveBeenCalled();
      expect(componentClickCancelEmitSpy).not.toHaveBeenCalled();
      expect(componentPrescriptionFormsUpdateSpy).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should reset the errorCard properties when closeErrorCard is called', () => {
      createFixture('mockPseudomizedKey');
      component.errorCard = {
        show: true,
        message: 'Some error occurred',
        errorResponse: { error: 'Some error details' } as HttpErrorResponse,
      };

      component.closeErrorCard();

      expect(component.errorCard).toEqual({
        show: false,
        message: '',
        errorResponse: undefined,
      });
    });
    it('should show error card and update statuses when all operations fail', () => {
      createFixture('mockPseudomizedKey');
      const results = [
        { trackId: 1, status: LoadingStatus.ERROR, error: 'Error 1' },
        { trackId: 2, status: LoadingStatus.ERROR, error: 'Error 2' },
      ];

      const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {});
      const prescriptionFormsUpdateSpy = jest.spyOn(component.prescriptionForms, 'update');
      const componentLoadingSetSpy = jest.spyOn(component.loading, 'set');

      component.initialValues = {
        intent: 'order',
      };
      component.handleCreateBulkResultExtended(results);

      expect(component.errorCard).toEqual({
        show: true,
        message: 'prescription.create.allFailed',
        translationOptions: { count: 2 },
        errorResponse: undefined,
      });

      expect(prescriptionFormsUpdateSpy).toHaveBeenCalled();
      expect(consoleErrorMock).toHaveBeenCalledTimes(2);
      expect(consoleErrorMock).toHaveBeenCalledWith(0, 'Error 1');
      expect(consoleErrorMock).toHaveBeenCalledWith(1, 'Error 2');
      expect(componentLoadingSetSpy).toHaveBeenCalledWith(false);

      consoleErrorMock.mockRestore();
    });
    it('should show error card with proposal.create.allFailed when all operations fail and intent is "proposal"', () => {
      createFixture('mockPseudomizedKey');
      const results = [
        { trackId: 1, status: LoadingStatus.ERROR, error: 'Error 1' },
        { trackId: 2, status: LoadingStatus.ERROR, error: 'Error 2' },
      ];

      const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {});
      const prescriptionFormsUpdateSpy = jest.spyOn(component.prescriptionForms, 'update');
      const componentLoadingSetSpy = jest.spyOn(component.loading, 'set');

      component.initialValues = {
        intent: Intent.PROPOSAL,
      };
      component.handleCreateBulkResultExtended(results);

      expect(component.errorCard).toEqual({
        show: true,
        message: 'proposal.create.allFailed',
        translationOptions: { count: 2 },
        errorResponse: undefined,
      });

      expect(prescriptionFormsUpdateSpy).toHaveBeenCalled();
      expect(consoleErrorMock).toHaveBeenCalledTimes(2); // Expect 2 errors
      expect(consoleErrorMock).toHaveBeenCalledWith(0, 'Error 1');
      expect(consoleErrorMock).toHaveBeenCalledWith(1, 'Error 2');
      expect(componentLoadingSetSpy).toHaveBeenCalledWith(false);

      consoleErrorMock.mockRestore();
    });
    it('should handle encryption errors gracefully', done => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      createFixture('mockPseudomizedKey');
      mockEncryptionKeyInitializerService.getCryptoKey.mockReturnValue('test-cryptoKey' as unknown as CryptoKey);
      jest.spyOn(component as any, 'getPrescriptionTemplateStream').mockReturnValue(() => ({
        data: {
          elements: [{ id: 'field1', tags: ['freeText'] }],
        },
      }));

      const mockError = 'Encryption failed';
      mockEncryptionService.encryptText.mockReturnValue(throwError(() => mockError));

      const responses = { field1: 'value1' };
      component.encryptFreeTextInResponsesExtended('templateCode', responses).subscribe(result => {
        expect(result).toEqual({ field1: 'value1' });
        done();
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error encrypting key "field1":', mockError);
    });

    it('should generate a new Uuid when generateNewUuid is called', () => {
      createFixture('mockGenerateNewUuid');

      const initialForms: CreatePrescriptionForm[] = [
        {
          generatedUUID: '123',
          trackId: 1,
          templateCode: 'template1',
          formTemplateState$: signal({ status: LoadingStatus.SUCCESS }),
        },
        {
          generatedUUID: '1234',
          trackId: 2,
          templateCode: 'template2',
          formTemplateState$: signal({ status: LoadingStatus.SUCCESS }),
        },
      ];

      (uuidv4 as jest.Mock).mockReturnValue('xxx');

      component.prescriptionForms.set(initialForms);

      const uuidsBefore = component.prescriptionForms().map(form => form.generatedUUID);

      component['generateNewUuid']();

      const uuidsAfter = component.prescriptionForms().map(form => form.generatedUUID);

      expect(uuidsAfter).not.toEqual(uuidsBefore);
      expect(uuidsAfter).toEqual(['xxx', 'xxx']);
    });
  });

  describe('prescription extension', () => {
    it('should return initialPrescription unchanged if extend is false', () => {
      createFixture('mockPseudomizedKey');
      component.initialValues = {
        intent: 'order',
        extend: false,
      };
      const prescription: ReadRequestResource = {
        authoredOn: '',
        organizationTasks: [],
        patientIdentifier: '',
        performerTasks: [],
        period: { end: '', start: '' },
        referralTask: {} as ReferralTaskResource,
        templateCode: '',
        id: '123',
        responses: {},
        intent: Intent.ORDER,
        category: 'nursing',
      };

      const result = component.updateResponses(prescription);

      expect(result).toBe(prescription);
    });
    it('should return initialPrescription unchanged if responses is undefined', () => {
      createFixture('mockPseudomizedKey');
      component.initialValues = {
        intent: 'order',
        extend: true,
      };
      const prescription: ReadRequestResource = {
        authoredOn: '',
        organizationTasks: [],
        patientIdentifier: '',
        performerTasks: [],
        period: { end: '', start: '' },
        referralTask: {} as ReferralTaskResource,
        templateCode: '',
        id: '123',
        responses: undefined as unknown as Record<string, any>,
        intent: Intent.ORDER,
        category: 'nursing',
      };
      const result = component.updateResponses(prescription);
      expect(result).toBe(prescription);
    });

    it('should return initialPrescription unchanged if responses is undefined', () => {
      createFixture('mockPseudomizedKey');
      component.initialValues = {
        intent: 'order',
        extend: true,
      };
      const prescription: ReadRequestResource = {
        authoredOn: '',
        organizationTasks: [],
        patientIdentifier: '',
        performerTasks: [],
        period: { end: '', start: '' },
        referralTask: {} as ReferralTaskResource,
        templateCode: '',
        id: '123',
        responses: undefined as unknown as Record<string, any>,
        intent: Intent.ORDER,
        category: 'nursing',
      };
      const result = component.updateResponses(prescription);
      expect(result).toBe(prescription);
    });

    it('should return initialPrescription unchanged if responses is undefined', () => {
      createFixture('mockPseudomizedKey');
      component.initialValues = {
        intent: 'order',
        extend: true,
      };
      const prescription: ReadRequestResource = {
        authoredOn: '',
        organizationTasks: [],
        patientIdentifier: '',
        performerTasks: [],
        period: { end: '', start: '' },
        referralTask: {} as ReferralTaskResource,
        templateCode: '',
        id: '123',
        responses: undefined as unknown as Record<string, any>,
        intent: 'order',
        category: 'nursing',
      };

      const result = component.updateResponses(prescription);

      expect(result).toBe(prescription);
    });

    it('should return initialPrescription unchanged if prescriptionOriginId already exists', () => {
      createFixture('mockPseudomizedKey');
      component.initialValues = {
        intent: 'order',
        extend: true,
      };
      const prescription: ReadRequestResource = {
        authoredOn: '',
        organizationTasks: [],
        patientIdentifier: '',
        performerTasks: [],
        period: { end: '', start: '' },
        referralTask: {} as ReferralTaskResource,
        templateCode: '',
        id: '123',
        responses: { prescriptionOriginId: '456' },
        intent: 'order',
        category: 'nursing',
      };

      const result = component.updateResponses(prescription);
      expect(result).toBe(prescription);
    });

    it('should return initialPrescription unchanged if responses is undefined', () => {
      createFixture('mockPseudomizedKey');
      component.initialValues = {
        intent: 'order',
        extend: true,
      };
      const prescription: ReadRequestResource = {
        authoredOn: '',
        organizationTasks: [],
        patientIdentifier: '',
        performerTasks: [],
        period: { end: '', start: '' },
        referralTask: {} as ReferralTaskResource,
        templateCode: '',
        id: '123',
        responses: undefined as unknown as Record<string, any>,
        intent: Intent.ORDER,
        category: 'nursing',
      };

      const result = component.updateResponses(prescription);

      expect(result).toBe(prescription);
    });

    it('should return initialPrescription unchanged if prescriptionOriginId already exists', () => {
      createFixture('mockPseudomizedKey');
      component.initialValues = {
        intent: 'order',
        extend: true,
      };
      const prescription: ReadRequestResource = {
        authoredOn: '',
        organizationTasks: [],
        patientIdentifier: '',
        performerTasks: [],
        period: { end: '', start: '' },
        referralTask: {} as ReferralTaskResource,
        templateCode: '',
        id: '123',
        responses: { prescriptionOriginId: '456' },
        intent: Intent.ORDER,
        category: 'nursing',
      };

      const result = component.updateResponses(prescription);

      expect(result).toBe(prescription);
    });

    it('should return initialPrescription unchanged if initialPrescription.id is undefined', () => {
      createFixture('mockPseudomizedKey');
      component.initialValues = {
        intent: 'order',
        extend: true,
      };
      const prescription: ReadRequestResource = {
        authoredOn: '',
        organizationTasks: [],
        patientIdentifier: '',
        performerTasks: [],
        period: { end: '', start: '' },
        referralTask: {} as ReferralTaskResource,
        templateCode: '',
        id: undefined as unknown as string,
        responses: {},
        intent: Intent.ORDER,
        category: 'nursing',
      };

      const result = component.updateResponses(prescription);

      expect(result).toBe(prescription);
    });

    it('should set prescriptionOriginId to initialPrescription.id when conditions are met', () => {
      createFixture('mockPseudomizedKey');
      component.initialValues = {
        intent: Intent.ORDER,
        extend: true,
      };
      const prescription: ReadRequestResource = {
        authoredOn: '',
        organizationTasks: [],
        patientIdentifier: '',
        performerTasks: [],
        period: { end: '', start: '' },
        referralTask: {} as ReferralTaskResource,
        templateCode: '',
        id: '123',
        responses: {},
        intent: Intent.ORDER,
        category: 'nursing',
      };

      const result = component.updateResponses(prescription);

      expect(result?.responses?.['prescriptionOriginId']).toBe('123');
    });
    it('should return initialPrescription response based on the occurrenceTiming', () => {
      createFixture('mockPseudomizedKey');
      component.initialValues = {
        intent: 'order',
        extend: true,
      };
      const prescription: ReadRequestResource = {
        authoredOn: '',
        organizationTasks: [],
        patientIdentifier: '',
        performerTasks: [],
        period: { end: '', start: '' },
        referralTask: {} as ReferralTaskResource,
        templateCode: '',
        category: 'nursing',
        intent: 'order',
        id: '123',
        responses: {
          feedback: false,
          diagnosis: 'test',
          nbSessions: 42,
          occurrenceTiming: {
            repeat: {
              boundsDuration: {
                value: 3,
                system: 'http://unitsofmeasure.org',
                code: 'wk',
              },
              count: 42,
              frequency: 2,
              period: 1,
              periodUnit: 'd',
              duration: 3,
              durationUnit: 'wk',
              dayOfWeek: ['mon'],
            },
          },
          boundsDuration: 3,
          boundsDurationUnit: 'wk',
          prescriptionOriginId: 'prescription-origin-id',
        },
      };

      const result = component.updateResponses(prescription);

      expect(result?.responses?.['boundsDuration']).toBe(3);
      expect(result?.responses?.['boundsDurationUnit']).toBe('wk');
      expect(result?.responses?.['sessionDuration']).toBe(3);
      expect(result?.responses?.['sessionDurationUnit']).toBe('wk');
      expect(result?.responses?.['dayOfWeek']).toEqual(['mon']);
    });
    it('should return initialPrescription response based on the occurrenceTiming', () => {
      createFixture('mockPseudomizedKey');
      component.initialValues = {
        intent: 'order',
        extend: true,
      };
      const prescription: ReadRequestResource = {
        authoredOn: '',
        organizationTasks: [],
        patientIdentifier: '',
        performerTasks: [],
        period: { end: '', start: '' },
        referralTask: {} as ReferralTaskResource,
        templateCode: '',
        id: '123',
        category: 'nursing',
        responses: {
          feedback: false,
          diagnosis: 'test',
          nbSessions: 42,
          occurrenceTiming: {
            repeat: {
              boundsDuration: {
                value: 3,
                system: 'http://unitsofmeasure.org',
                code: 'wk',
              },
              count: 42,
              frequency: 2,
              period: 1,
              periodUnit: 'd',
              duration: 3,
              durationUnit: 'wk',
              dayOfWeek: ['mon'],
            },
          },
          boundsDuration: 3,
          boundsDurationUnit: 'wk',
          prescriptionOriginId: 'prescription-origin-id',
        },
      };

      const result = component.updateResponses(prescription);

      expect(result?.responses?.['boundsDuration']).toBe(3);
      expect(result?.responses?.['boundsDurationUnit']).toBe('wk');
      expect(result?.responses?.['sessionDuration']).toBe(3);
      expect(result?.responses?.['sessionDurationUnit']).toBe('wk');
      expect(result?.responses?.['dayOfWeek']).toEqual(['mon']);
    });
  });

  describe('data encryption', () => {
    it('should log a warning if pseudonymizedKey is not set', done => {
      createFixture(undefined);

      const templateCode = 'template123';
      const responses = { question1: 'answer1' };
      const subject = 'testSubject';
      const mockEncryptedResponses = { question1: 'encryptedAnswer1' };

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      mockEncryptionKeyInitializerService.getPseudonymizedKey.mockReturnValue(undefined);

      jest.spyOn(component as any, 'encryptFreeTextInResponses').mockReturnValue(of(mockEncryptedResponses));

      component.toCreatePrescriptionRequestExtended(templateCode, responses, subject).subscribe({
        next: (result: any) => {
          expect(consoleWarnSpy).toHaveBeenCalledWith(
            'PseudonymizedKey key is not set. The request will proceed without it.'
          );

          expect(result).toEqual({
            templateCode,
            responses: mockEncryptedResponses,
            pseudonymizedKey: undefined,
            subject,
          });

          done();
        },
        error: () => {
          fail('Expected successful result, but got an error.');
        },
      });
    });
    it('should handle errors from encryptFreeTextInResponses', done => {
      createFixture('mockPseudomizedKey');
      const templateCode = 'template123';
      const responses = { question1: 'answer1' };
      const subject = 'testSubject';

      const mockError = 'Encryption failed';
      jest.spyOn(component as any, 'encryptFreeTextInResponses').mockReturnValue(throwError(() => mockError));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      component.toCreatePrescriptionRequestExtended(templateCode, responses, subject).subscribe({
        next: () => {
          fail('Expected an error, but got a successful result.');
        },
        error: error => {
          expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to create prescription request:', mockError);

          expect(error).toBe(mockError);

          done();
        },
      });
    });
    it('should return original responses if template is not found', done => {
      createFixture('mockPseudomizedKey');
      jest.spyOn(component as any, 'getPrescriptionTemplateStream').mockReturnValue(() => null);

      const responses = { field1: 'value1' };
      component.encryptFreeTextInResponsesExtended('templateCode', responses).subscribe(result => {
        expect(result).toEqual(responses);
        done();
      });
    });
    it('should return original responses if cryptoKey is missing', done => {
      createFixture('mockPseudomizedKey');
      jest.spyOn(component as any, 'getPrescriptionTemplateStream').mockReturnValue(() => ({ data: { elements: [] } }));
      mockEncryptionKeyInitializerService.getCryptoKey.mockReturnValue(undefined);

      const responses = { field1: 'value1' };
      component.encryptFreeTextInResponsesExtended('templateCode', responses).subscribe(result => {
        expect(result).toEqual(responses);
        done();
      });
    });
    it('should encrypt only fields marked as freeText', done => {
      createFixture('mockPseudomizedKey');
      mockEncryptionKeyInitializerService.getCryptoKey.mockReturnValue('test-cryptoKey' as unknown as CryptoKey);
      jest.spyOn(component as any, 'getPrescriptionTemplateStream').mockReturnValue(() => ({
        data: {
          elements: [
            { id: 'field1', tags: ['freeText'] },
            { id: 'field2', tags: [] },
          ],
        },
      }));

      mockEncryptionService.encryptText.mockReturnValue(of('encrypted-value1'));

      const responses = { field1: 'value1', field2: 'value2' };
      component.encryptFreeTextInResponsesExtended('templateCode', responses).subscribe(result => {
        expect(result).toEqual({
          field1: 'encrypted-value1',
          field2: 'value2',
        });
        expect(mockEncryptionService.encryptText).toHaveBeenCalledWith('test-cryptoKey', 'value1');
        done();
      });
    });
    it('should encrypt multiple freeText fields', done => {
      createFixture('mockPseudomizedKey');
      mockEncryptionKeyInitializerService.getCryptoKey.mockReturnValue('test-cryptoKey' as unknown as CryptoKey);
      jest.spyOn(component as any, 'getPrescriptionTemplateStream').mockReturnValue(() => ({
        data: {
          elements: [
            { id: 'field1', tags: ['freeText'] },
            { id: 'field2', tags: ['freeText'] },
            { id: 'field3', tags: [] },
          ],
        },
      }));

      mockEncryptionService.encryptText.mockImplementation((key, value) => of(`encrypted-${value}`));

      const responses = {
        field1: 'value1',
        field2: 'value2',
        field3: 'value3',
      };
      component.encryptFreeTextInResponsesExtended('templateCode', responses).subscribe(result => {
        expect(result).toEqual({
          field1: 'encrypted-value1',
          field2: 'encrypted-value2',
          field3: 'value3', // Not encrypted
        });
        done();
      });
    });
    it('should encrypt freeText fields within nested objects', done => {
      createFixture('mockPseudomizedKey');
      mockEncryptionKeyInitializerService.getCryptoKey.mockReturnValue('test-cryptoKey' as unknown as CryptoKey);

      jest.spyOn(component as any, 'getPrescriptionTemplateStream').mockReturnValue(() => ({
        data: {
          elements: [
            {
              id: 'section1',
              subFormElements: [
                { id: 'nestedField1', tags: ['freeText'] },
                { id: 'nestedField2', tags: [] },
              ],
            },
            { id: 'topLevelField', tags: [] },
          ],
        },
      }));

      mockEncryptionService.encryptText.mockReturnValue(of('encrypted-nested-value'));

      const responses = {
        section1: {
          nestedField1: 'sensitive nested text',
          nestedField2: 'normal nested text',
        },
        topLevelField: 'top level text',
      };

      component.encryptFreeTextInResponsesExtended('templateCode', responses).subscribe(result => {
        expect(result).toEqual({
          section1: {
            nestedField1: 'encrypted-nested-value',
            nestedField2: 'normal nested text',
          },
          topLevelField: 'top level text',
        });
        expect(mockEncryptionService.encryptText).toHaveBeenCalledWith('test-cryptoKey', 'sensitive nested text');
        done();
      });
    });
  });

  describe('operation results and notifications', () => {
    it('should show success toast and emit event when all operations succeed', () => {
      createFixture('mockPseudomizedKey');
      const toasterSpy = jest.spyOn(toaster, 'show');
      const emitPrescriptionCreated = jest.spyOn(component.prescriptionsCreated, 'emit');

      const results = [
        { responseId: '123', trackId: 1, status: LoadingStatus.SUCCESS },
        { responseId: '234', trackId: 2, status: LoadingStatus.SUCCESS },
      ];

      component.initialValues = {
        intent: 'order',
      };
      component.handleCreateBulkResultExtended(results);

      expect(toasterSpy).toHaveBeenCalledWith('prescription.create.allSuccess', { interpolation: { count: 2 } });
      expect(emitPrescriptionCreated).toHaveBeenCalledWith(['123', '234']);
    });
    it('should show mixed success message when some succeed and some fail', () => {
      createFixture('mockPseudomizedKey');
      const results = [
        { responseId: '123', trackId: 1, status: LoadingStatus.SUCCESS },
        { responseId: '234', trackId: 2, status: LoadingStatus.ERROR, error: 'Error 2' },
      ];

      const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {});
      const prescriptionFormsUpdateSpy = jest.spyOn(component.prescriptionForms, 'update');
      const componentLoadingSetSpy = jest.spyOn(component.loading, 'set');

      component.initialValues = {
        intent: 'order',
      };
      component.handleCreateBulkResultExtended(results);

      expect(component.errorCard).toEqual({
        show: true,
        message: 'prescription.create.someSuccessSomeFailed',
        translationOptions: { successCount: 1, failedCount: 1 },
        errorResponse: undefined,
      });

      expect(prescriptionFormsUpdateSpy).toHaveBeenCalled();
      expect(consoleErrorMock).toHaveBeenCalledTimes(1);
      expect(consoleErrorMock).toHaveBeenCalledWith(1, 'Error 2');
      expect(componentLoadingSetSpy).toHaveBeenCalledWith(false);

      consoleErrorMock.mockRestore();
    });
    it('should show proposal.create.someSuccessSomeFailed message when some succeed and some fail and intent is "proposal"', () => {
      createFixture('mockPseudomizedKey');
      const results = [
        { trackId: 1, status: LoadingStatus.SUCCESS },
        { trackId: 2, status: LoadingStatus.ERROR, error: 'Error 2' },
      ];

      const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {});

      component.initialValues = {
        intent: Intent.PROPOSAL,
      };
      component.handleCreateBulkResultExtended(results);

      expect(component.errorCard).toEqual({
        show: true,
        message: 'proposal.create.someSuccessSomeFailed',
        translationOptions: { successCount: 1, failedCount: 1 },
        errorResponse: undefined,
      });

      expect(consoleErrorMock).toHaveBeenCalledTimes(1);
      expect(consoleErrorMock).toHaveBeenCalledWith(1, 'Error 2');

      consoleErrorMock.mockRestore();
    });
  });

  describe('pss integration', () => {
    it('should call handleTokenChange when services change', () => {
      createFixture('mockPseudomizedKey');
      const spy = jest.spyOn(component as any, 'handleTokenChange');
      jest.spyOn(cacheHttpService, 'loadFromCache').mockReturnValue(of(null));
      const changes: SimpleChanges = {
        services: {
          currentValue: { getAccessToken: jest.fn() },
          previousValue: 'old',
          firstChange: false,
          isFirstChange: () => false,
        },
      };
      component.services = { getAccessToken: jest.fn() };
      component.ngOnChanges(changes);
      getTemplates();
      getAccessMatrix();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should call loadPssStatus when initialValues change and templateCode is ANNEX_82', () => {
      createFixture('mockPseudomizedKey');
      const mockInitialValues = {
        intent: 'order',
        initialPrescription: { templateCode: 'ANNEX_82' } as ReadRequestResource,
      };
      component.initialValues = mockInitialValues;
      // On stub loadPssStatus pour ne vérifier que l'appel
      const spy = jest.spyOn(component as any, 'loadPssStatus').mockImplementation(() => {});
      const changes: SimpleChanges = {
        initialValues: {
          currentValue: mockInitialValues,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true,
        },
      };
      component.ngOnChanges(changes);
      expect(spy).toHaveBeenCalledWith(mockInitialValues);
    });

    it('should call handlePrescriptionChanges when initialValues change and templateCode is not ANNEX_82', () => {
      createFixture('mockPseudomizedKey');
      const mockInitialValues = {
        intent: 'order',
        initialPrescription: { templateCode: 'OTHER' } as ReadRequestResource,
      };
      component.initialValues = mockInitialValues;
      // On stub handlePrescriptionChanges pour éviter le HTTP
      const changeSpy = jest.spyOn(component as any, 'handlePrescriptionChanges').mockImplementation(() => {});
      const loadSpy = jest.spyOn(component as any, 'loadPssStatus');
      const changes: SimpleChanges = {
        initialValues: {
          currentValue: mockInitialValues,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true,
        },
      };
      component.ngOnChanges(changes);
      expect(loadSpy).not.toHaveBeenCalled();
      expect(changeSpy).toHaveBeenCalledWith(mockInitialValues);
    });

    it('should handle both services and initialValues changes', () => {
      createFixture('mockPseudomizedKey');
      const mockInitialValues = {
        intent: 'order',
        initialPrescription: { templateCode: 'ANNEX_82' } as ReadRequestResource,
      };
      component.initialValues = mockInitialValues;
      const tokenSpy = jest.spyOn(component as any, 'handleTokenChange');
      // Stub loadPssStatus pour ne pas déclencher le subscribe
      const loadSpy = jest.spyOn(component as any, 'loadPssStatus').mockImplementation(() => {});
      jest.spyOn(cacheHttpService, 'loadFromCache').mockReturnValue(of(null));
      const changes: SimpleChanges = {
        services: {
          currentValue: { getAccessToken: jest.fn() },
          previousValue: 'old',
          firstChange: false,
          isFirstChange: () => false,
        },
        initialValues: {
          currentValue: mockInitialValues,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true,
        },
      };
      component.services = { getAccessToken: jest.fn() };
      component.ngOnChanges(changes);
      getTemplates();
      getAccessMatrix();
      expect(tokenSpy).toHaveBeenCalledTimes(1);
      expect(loadSpy).toHaveBeenCalledWith(mockInitialValues);
    });

    it('should set loading to true and call getPssStatus for ANNEX_82 templateCode', () => {
      createFixture('mockPseudomizedKey');
      const mockStatus = { status: 'active' };
      jest.spyOn(mockPssService, 'getPssStatus').mockReturnValue(of(mockStatus));
      component.initialValues = {
        intent: 'order',
        initialPrescription: { templateCode: 'ANNEX_82' } as ReadRequestResource,
      };
      const loadingSpy = jest.spyOn(component.loading, 'set');
      jest.spyOn(cacheHttpService, 'loadFromCache').mockReturnValue(of(null));

      const changes: SimpleChanges = {
        initialValues: {
          currentValue: component.initialValues,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true,
        },
      };
      component.ngOnChanges(changes);
      expect(loadingSpy).toHaveBeenCalledWith(true);
      expect(mockPssService.getPssStatus).toHaveBeenCalledTimes(1);
    });

    it('should skip getPssStatus and call handlePrescriptionChanges directly for non-ANNEX_82', () => {
      createFixture('mockPseudomizedKey');
      component.initialValues = {
        intent: 'order',
        initialPrescription: { templateCode: 'OTHER_TYPE' } as ReadRequestResource,
      };
      const handleSpy = jest.spyOn(component as any, 'handlePrescriptionChanges').mockImplementation(() => {});
      const loadingSpy = jest.spyOn(component.loading, 'set');
      const changes: SimpleChanges = {
        initialValues: {
          currentValue: component.initialValues,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true,
        },
      };
      component.ngOnChanges(changes);
      expect(loadingSpy).toHaveBeenCalledWith(true);
      expect(mockPssService.getPssStatus).not.toHaveBeenCalled();
      expect(handleSpy).toHaveBeenCalledWith(component.initialValues);
    });

    it('should handle case with no templateCode or initialPrescriptionType', () => {
      createFixture('mockPseudomizedKey');
      component.initialValues = {
        intent: 'order',
        initialPrescription: { templateCode: undefined } as any,
      };
      const handleSpy = jest.spyOn(component as any, 'handlePrescriptionChanges').mockImplementation(() => {});
      const loadingSpy = jest.spyOn(component.loading, 'set');
      const changes: SimpleChanges = {
        initialValues: {
          currentValue: component.initialValues,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true,
        },
      };
      component.ngOnChanges(changes);
      expect(loadingSpy).toHaveBeenCalledWith(false);
      expect(mockPssService.getPssStatus).not.toHaveBeenCalled();
      expect(handleSpy).not.toHaveBeenCalledWith(component.initialValues);
    });
  });

  describe('language switch', () => {
    it('should initialize language and locale if currentLang is not set', () => {
      createFixture('mockPseudomizedKey');
      const setLocalesSpy = jest.spyOn(dateAdapter, 'setLocale');

      translate.currentLang = '';

      expect(translate.getDefaultLang()).toBe('fr-BE');
      expect(setLocalesSpy).toHaveBeenCalledWith('fr-BE');
    });

    it('should not call use() or setLocale() with initial language only once', () => {
      translate.use('nl-BE');

      const translateUseSpy = jest.spyOn(translate, 'use');
      const dateAdapterSpy = jest.spyOn(dateAdapter, 'setLocale');

      createFixture('mockPseudomizedKey');

      expect(translateUseSpy).toHaveBeenCalledTimes(1);
      expect(dateAdapterSpy).toHaveBeenCalledTimes(1);
      expect(translateUseSpy).toHaveBeenCalledWith('nl-BE');
      expect(dateAdapterSpy).toHaveBeenCalledWith('nl-BE');
    });

    it('should update language by emitting a new lang with _languageChange()', () => {
      const translateUseSpy = jest.spyOn(translate, 'use');
      const dateAdapterSpy = jest.spyOn(dateAdapter, 'setLocale');

      createFixture('mockPseudomizedKey');

      component['_languageChange'].next('fr-FR');

      expect(translateUseSpy).toHaveBeenCalledWith('fr-FR');
      expect(dateAdapterSpy).toHaveBeenCalledWith('fr-FR');
    });

    it('should set langAlertData to null on successful translation', () => {
      createFixture('mockPseudomizedKey');
      jest.spyOn(translate, 'use').mockReturnValue(of({}));

      component.langAlertData.set({ title: 'Test', body: 'Test body' });

      component['_languageChange'].next('fr-FR');

      expect(component.langAlertData()).toBeNull();
    });

    it('should execute catchError operator and call handleMissingTranslationFile on error', () => {
      createFixture('mockPseudomizedKey');
      jest.spyOn(translate, 'use').mockReturnValue(throwError(() => new Error('Translation error')));

      (component as any)._languageChange.next('en-GB');

      component.ngOnInit();

      const alertData = component.langAlertData();
      expect(alertData).not.toBeNull();
      expect(alertData?.title).toBe('English translation coming soon.');
    });

    it('should handle missing translation for DE language', () => {
      createFixture('mockPseudomizedKey');
      jest.spyOn(translate, 'use').mockReturnValue(throwError(() => new Error('Missing translation')));

      (component as any)._languageChange.next('de-BE');
      component.ngOnInit();

      expect(component.langAlertData()?.title).toBe('Deutsche Übersetzung folgt in Kürze.');
    });

    it('should handle missing translation for FR language', () => {
      createFixture('mockPseudomizedKey');
      jest.spyOn(translate, 'use').mockReturnValue(throwError(() => new Error('Missing translation')));

      (component as any)._languageChange.next('fr-BE');
      component.ngOnInit();

      expect(component.langAlertData()?.title).toBe('Traduction en français à venir.');
    });

    it('should handle missing translation for NL language', () => {
      createFixture('mockPseudomizedKey');
      jest.spyOn(translate, 'use').mockReturnValue(throwError(() => new Error('Missing translation')));

      (component as any)._languageChange.next('nl-BE');
      component.ngOnInit();

      expect(component.langAlertData()?.title).toBe('De Nederlandse vertaling ontbreekt.');
    });

    it('should handle missing translation for EN language', () => {
      createFixture('mockPseudomizedKey');
      jest.spyOn(translate, 'use').mockReturnValue(throwError(() => new Error('Missing translation')));

      component['_languageChange'].next('en-GB');

      const alertData = component.langAlertData();
      expect(alertData).not.toBeNull();
      expect(alertData?.title).toBe('English translation coming soon.');
      expect(alertData?.body).toBe('In the meantime, you can view the content in Dutch or French.');
    });

    it('should handle missing translation for unknown language', fakeAsync(() => {
      createFixture('mockPseudomizedKey');
      jest.spyOn(translate, 'use').mockReturnValue(throwError(() => new Error('Missing translation')));

      const unknownLang = 'xx-XX';
      (component as any)._languageChange.next(unknownLang);
      component.ngOnInit();

      const alertData = component.langAlertData();
      expect(alertData?.title).toBe('Unknown lang');
      expect(alertData?.body).toContain(unknownLang);
    }));
  });

  describe('ngOnInit tests', () => {
    it('should call translate.use in ngOnInit subscription', () => {
      createFixture('mockPseudomizedKey');
      const translateUseSpy = jest.spyOn(translate, 'use').mockReturnValue(of({}));

      translateUseSpy.mockClear();

      component.ngOnInit();

      expect(translateUseSpy).toHaveBeenCalled();
    });

    it('should set langAlertData to null on successful translation in ngOnInit', () => {
      createFixture('mockPseudomizedKey');

      component.langAlertData.set({ title: 'Test', body: 'Test body' });

      component.ngOnInit();

      expect(component.langAlertData()).toBeNull();
    });

    it('should execute tap operator to set dateAdapter locale in ngOnInit', () => {
      createFixture('mockPseudomizedKey');
      const setLocaleSpy = jest.spyOn(dateAdapter, 'setLocale');

      const testLang = 'de-DE';
      (component as any)._languageChange.next(testLang);

      component.ngOnInit();

      expect(setLocaleSpy).toHaveBeenCalledWith(testLang);
    });

    it('should execute catchError operator and return EMPTY on error in ngOnInit', () => {
      createFixture('mockPseudomizedKey');
      jest.spyOn(translate, 'use').mockReturnValue(throwError(() => new Error('Translation error')));

      component.ngOnInit();

      expect(component.langAlertData()).not.toBeNull();
    });

    it('should handle the complete pipe chain in ngOnInit: tap -> switchMap -> catchError -> subscribe', () => {
      createFixture('mockPseudomizedKey');

      const setLocaleSpy = jest.spyOn(dateAdapter, 'setLocale');
      const translateUseSpy = jest.spyOn(translate, 'use').mockReturnValue(of({}));
      const langAlertSetSpy = jest.spyOn(component.langAlertData, 'set');

      const testLang = 'fr-FR';
      (component as any)._languageChange.next(testLang);

      component.ngOnInit();

      expect(setLocaleSpy).toHaveBeenCalledWith(testLang);
      expect(translateUseSpy).toHaveBeenCalledWith(testLang);
      expect(langAlertSetSpy).toHaveBeenCalledWith(null);
    });

    it('should use currentLang from translate service when _languageChange is initialized in ngOnInit', () => {
      translate.currentLang = 'nl-BE';

      const translateUseSpy = jest.spyOn(translate, 'use').mockReturnValue(of({}));
      const setLocaleSpy = jest.spyOn(dateAdapter, 'setLocale');

      createFixture('mockPseudomizedKey');

      component.ngOnInit();

      expect(setLocaleSpy).toHaveBeenCalledWith('nl-BE');
      expect(translateUseSpy).toHaveBeenCalledWith('nl-BE');
    });

    describe('findModelById', () => {

      it('should call addPrescriptionFormByModel when model is found', fakeAsync(() => {
        createFixture('mockPseudomizedKey');

        const templateCode = 'TEMPLATE_001';
        const modelId = 42;
        const mockModel = { id: 42, name: 'Test Model', code: 'M001' };

        jest.spyOn(component['prescriptionModelService'], 'findById')
          .mockReturnValue(of(mockModel));

        const addFormSpy = jest.spyOn(component as any, 'addPrescriptionFormByModel')
          .mockImplementation(() => {});
        const loadingSpy = jest.spyOn(component['loading'], 'set');

        (component as any).findModelById(templateCode, modelId);
        tick();

        expect(addFormSpy).toHaveBeenCalledWith(templateCode, mockModel);
        expect(loadingSpy).toHaveBeenCalledWith(false);
        expect(loadingSpy).toHaveBeenCalledTimes(1);
      }));

      it('should show error toast when model is null', fakeAsync(() => {
        createFixture('mockPseudomizedKey');

        const templateCode = 'TEMPLATE_001';
        const modelId = 999;

        jest.spyOn(component['prescriptionModelService'], 'findById')
          .mockReturnValue(of(null)as any);

        const addFormSpy = jest.spyOn(component as any, 'addPrescriptionFormByModel');
        const toastSpy = jest.spyOn(component['toastService'], 'showSomethingWentWrong');
        const loadingSpy = jest.spyOn(component['loading'], 'set');

        (component as any).findModelById(templateCode, modelId);
        tick();

        expect(addFormSpy).not.toHaveBeenCalled();
        expect(toastSpy).toHaveBeenCalled();
        expect(loadingSpy).toHaveBeenCalledWith(false);
        expect(loadingSpy).toHaveBeenCalledTimes(1);
      }));

      it('should show error toast when service throws error', fakeAsync(() => {
        createFixture('mockPseudomizedKey');

        const templateCode = 'TEMPLATE_001';
        const modelId = 42;
        const serviceError = new Error('Service unavailable');

        jest.spyOn(component['prescriptionModelService'], 'findById')
          .mockReturnValue(throwError(() => serviceError));

        const addFormSpy = jest.spyOn(component as any, 'addPrescriptionFormByModel');
        const toastSpy = jest.spyOn(component['toastService'], 'showSomethingWentWrong');
        const loadingSpy = jest.spyOn(component['loading'], 'set');

        (component as any).findModelById(templateCode, modelId);
        tick();

        expect(addFormSpy).not.toHaveBeenCalled();
        expect(toastSpy).toHaveBeenCalled();
        expect(loadingSpy).toHaveBeenCalledWith(false);
        expect(loadingSpy).toHaveBeenCalledTimes(1);
      }));

      it('should call prescriptionModelService.findById with correct modelId', fakeAsync(() => {
        createFixture('mockPseudomizedKey');

        const modelId = 123;
        const templateCode = 'TEMPLATE';

        const findByIdSpy = jest.spyOn(component['prescriptionModelService'], 'findById')
          .mockReturnValue(of(null)as any);

        (component as any).findModelById(templateCode, modelId);
        tick();

        expect(findByIdSpy).toHaveBeenCalledWith(modelId);
        expect(findByIdSpy).toHaveBeenCalledTimes(1);
      }));
    });
  });

  const createFixture = (pseudonymizedKey?: string) => {
    fixture = TestBed.createComponent(CreatePrescriptionExtendedWebComponent);
    component = fixture.componentInstance;
    mockEncryptionKeyInitializerService.getPseudonymizedKey.mockReturnValue(() => ({ data: pseudonymizedKey }));
    component.initialValues = { intent: 'order' };
    (component as any).isEnabled$ = of(true);

    if (pseudonymizedKey) {
      jest.spyOn(pseudoService, 'byteArrayToValue').mockReturnValue({ pseudonymize: jest.fn() } as any);
      jest.spyOn(pseudoService, 'pseudonymizeValue').mockReturnValue(Promise.resolve('mockPseudomizedKey'));
    }

    fixture.detectChanges();
  };

  const getPatient = (ssin: string, person: PersonResource) => {
    const req = httpMock.expectOne(`${BASE_URL}/persons/${ssin}`);
    expect(req.request.method).toBe('GET');
    req.flush(person);
  };

  const getTemplates = () => {
    const req = httpMock.expectOne(`${BASE_URL}/templates`);
    expect(req.request.method).toBe('GET');
    req.flush({ status: 200 });
  };

  const getAccessMatrix = () => {
    const req = httpMock.expectOne(`${BASE_URL}/accessMatrix`);
    expect(req.request.method).toBe('GET');
    req.flush({ status: 200 });
  };

  const getTemplate = (templateCode: string | undefined) => {
    const req = httpMock.expectOne(`${BASE_URL}/templates/${templateCode}/versions/latest`);
    expect(req.request.method).toBe('GET');
    req.flush({ status: 200 });
  };

  const setOnePrescription = () => {
    component.prescriptionForms.set([
      {
        elementGroup: {
          markAllAsTouched: jest.fn(),
          valid: true,
          getOutputValue: jest.fn(),
        } as unknown as ElementGroup,
        submitted: false,
      } as unknown as CreatePrescriptionForm,
    ]);
  };

  const setMultiplePrescriptions = () => {
    component.prescriptionForms.set([
      {
        elementGroup: {
          markAllAsTouched: jest.fn(),
          valid: true,
          getOutputValue: jest.fn(),
        } as unknown as ElementGroup,
        submitted: false,
      } as unknown as CreatePrescriptionForm,
      {
        elementGroup: {
          markAllAsTouched: jest.fn(),
          valid: true,
          getOutputValue: jest.fn(),
        } as unknown as ElementGroup,
        submitted: false,
      } as unknown as CreatePrescriptionForm,
    ]);
  };
});
