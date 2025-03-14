import { ComponentFixture, fakeAsync, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { PseudoService } from '@reuse/code/services/pseudo.service';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MatNativeDateModule } from '@angular/material/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClient, HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { importProvidersFrom, Signal, SimpleChange, SimpleChanges } from '@angular/core';
import { ConfigurationService } from '@reuse/code/services/configuration.service';
import { AuthService } from '@reuse/code/services/auth.service';
import { CreatePrescriptionWebComponent } from './create-prescription.component';
import { Observable, of, throwError } from 'rxjs';
import { PseudonymisationHelper, Value } from '@smals-belgium-shared/pseudo-helper/dist';
import { ElementGroup, FormTemplate } from '@smals/vas-evaluation-form-ui-core';
import { DataState, LoadingStatus, Person, ReadPrescription, ReferralTask } from '@reuse/code/interfaces';
import { EncryptionService } from '@reuse/code/services/encryption.service';
import {
  CreatePrescriptionForm
} from '@reuse/code/components/create-multiple-prescriptions/create-multiple-prescriptions.component';
import { CreatePrescriptionExtendedWebComponent } from './create-prescription-extended.component';
import { By } from '@angular/platform-browser';
import { ConfirmDialog } from '@reuse/code/dialogs/confirm/confirm.dialog';
import { ToastService } from '@reuse/code/services/toast.service';
import { CancelCreationDialog } from '@reuse/code/dialogs/cancel-creation/cancel-creation.dialog';

class FakeLoader implements TranslateLoader {
  getTranslation(lang: string): Observable<any> {
    return of({});
  }
}

const mockConfigService = {
  getEnvironment: jest.fn(),
  getEnvironmentVariable: jest.fn()
}

const mockEncryptionService = {
  generateKey: () => 'cryptoKey',
  exportKey: () => new ArrayBuffer(16),
  encryptText: jest.fn()
}

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

const mockSignal = jest.fn() as unknown as Signal<DataState<FormTemplate>>;

// Mock the 'uuid' module
jest.mock('uuid', () => ({
  v4: jest.fn(),
}));

describe('CreatePrescriptionWebComponent', () => {
  let component: CreatePrescriptionExtendedWebComponent;
  let fixture: ComponentFixture<CreatePrescriptionExtendedWebComponent>;
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let pseudoService: PseudoService;
  let dialog: MatDialog;
  let toaster: ToastService;

  beforeAll(() => {
    Object.defineProperty(window, 'crypto', {
      value: {
        subtle: {
          importKey: jest.fn(), // Mock the `importKey` function
          decrypt: jest.fn(),
          getRandomValues: jest.fn()
        },
      },
    });
  })

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreatePrescriptionExtendedWebComponent, CreatePrescriptionWebComponent, TranslateModule.forRoot({
        loader: {provide: TranslateLoader, useClass: FakeLoader},
      }), HttpClientTestingModule, MatDatepickerModule,
        MatNativeDateModule, MatDialogModule, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        DateAdapter,
        importProvidersFrom(MatNativeDateModule),
        {provide: ConfigurationService, useValue: mockConfigService},
        {provide: AuthService, useValue: mockAuthService},
        MatDialog,
        {provide: PseudonymisationHelper, useValue: MockPseudoHelperFactory()},
        {provide: EncryptionService, useValue: mockEncryptionService}
      ],
    })
      .compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
    pseudoService = TestBed.inject(PseudoService);
    dialog = TestBed.inject(MatDialog);
    toaster = TestBed.inject(ToastService);
  })

  afterEach(() => {
    httpMock.verify();
  });

  it('should create the app', () => {
    createFixture('mockPseudomizedKey');
    expect(component).toBeTruthy();
  });

  it('should display a form', () => {
    createFixture('mockPseudomizedKey');
    const ssin = 'ssin';
    const person: Person = {
      ssin: ssin
    }

    const {debugElement} = fixture;
    let createMultiplePrescriptionsComponent = debugElement.query(By.css('app-create-multiple-prescriptions'));

    //no patient loaded => no form
    expect(component.patientState$()).toStrictEqual({status: LoadingStatus.INITIAL})
    expect(createMultiplePrescriptionsComponent).toBeNull();

    //load patient => display form
    jest.spyOn(component['patientStateService'], 'state').mockReturnValue({data: person, status: LoadingStatus.SUCCESS})

    const simpleChanges: SimpleChanges = {patientSsin: new SimpleChange('', ssin, true)}
    component.patientSsin = ssin;
    component.ngOnChanges(simpleChanges)

    getPatient(ssin, person);

    expect(component.patientState$()).toStrictEqual({data: person, params: undefined, status: LoadingStatus.SUCCESS})

    fixture.detectChanges();
    createMultiplePrescriptionsComponent = debugElement.query(By.css('app-create-multiple-prescriptions')).nativeElement;
    expect(createMultiplePrescriptionsComponent).toBeTruthy();
  });

  it('should call publishOnePrescription when one prescription form is present and valid', fakeAsync(() => {
    createFixture('mockPseudomizedKey')

    //1 form
    setOnePrescription();

    const mockUpdate = jest.fn((updateFn) => updateFn([{submitted: true}]));
    jest.spyOn(component.prescriptionForms, 'update').mockImplementation(mockUpdate);

    jest.spyOn(component['prescriptionService'], 'create').mockReturnValue(of());

    const mockPublish = jest.spyOn(component, 'publishPrescriptions');
    const mockPublishOnePrescription = jest.spyOn(component as any, 'publishOnePrescription');


    component.publishPrescriptions();

    expect(mockPublish).toHaveBeenCalled();
    expect(mockPublishOnePrescription).toHaveBeenCalled();

  }));

  it('should call publishMultiplePrescriptions when more then one prescription form is present and valid', fakeAsync(() => {
    createFixture('mockPseudomizedKey');

    //2 forms
   setMultiplePrescriptions();

    const mockUpdate = jest.fn((updateFn) => updateFn([{submitted: true}]));
    jest.spyOn(component.prescriptionForms, 'update').mockImplementation(mockUpdate);

    jest.spyOn(component['prescriptionService'], 'create').mockReturnValue(of());

    const mockPublish = jest.spyOn(component, 'publishPrescriptions');
    const mockPublishMultiplePrescriptions = jest.spyOn(component as any, 'publishMultiplePrescriptions');


    component.publishPrescriptions();

    expect(mockPublish).toHaveBeenCalled();
    expect(mockPublishMultiplePrescriptions).toHaveBeenCalled();

  }));

  it('should log a warning if pseudomizedKey is not set', (done) => {
    createFixture(undefined);

    const templateCode = 'template123';
    const responses = {question1: 'answer1'};
    const subject = 'testSubject';
    const mockEncryptedResponses = {question1: 'encryptedAnswer1'};

    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

    jest.spyOn(component as any, 'encryptFreeTextInResponses').mockReturnValue(of(mockEncryptedResponses));

    component.toCreatePrescriptionRequestExtended(templateCode, responses, subject).subscribe({
      next: (result: any) => {
        expect(consoleWarnSpy).toHaveBeenCalledWith('Pseudomized key is not set. The request will proceed without it.');

        expect(result).toEqual({
          templateCode,
          responses: mockEncryptedResponses,
          pseudomizedKey: undefined,
          subject,
        });

        done();
      },
      error: () => {
        fail('Expected successful result, but got an error.');
      },
    });
  });

  it('should handle errors from encryptFreeTextInResponses', (done) => {
    createFixture('mockPseudomizedKey');
    const templateCode = 'template123';
    const responses = {question1: 'answer1'};
    const subject = 'testSubject';

    const mockError = new Error('Encryption failed');
    jest.spyOn(component as any, 'encryptFreeTextInResponses').mockReturnValue(throwError(() => mockError));

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    component.toCreatePrescriptionRequestExtended(templateCode, responses, subject).subscribe({
      next: () => {
        fail('Expected an error, but got a successful result.');
      },
      error: (error) => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to create prescription request:', mockError);

        expect(error).toBe(mockError);

        done();
      },
    });
  });

  it('should open the dialog when addPrescription is called', () => {
    createFixture('mockPseudomizedKey');
    const openDialogSpy = jest.spyOn(dialog, 'open');
    const dialogRefMock = {beforeClosed: jest.fn().mockReturnValue(of(null))};
    openDialogSpy.mockReturnValue(dialogRefMock as any);

    component.addPrescription();

    expect(dialog.open).toHaveBeenCalled();
  });

  it('should call addPrescriptionForm when a valid templateCode is returned', () => {
    createFixture('mockPseudomizedKey');
    const openDialogSpy = jest.spyOn(dialog, 'open');
    const templateCode = '123ABC';
    const dialogRefMock = {beforeClosed: jest.fn().mockReturnValue(of({templateCode}))};
    openDialogSpy.mockReturnValue(dialogRefMock as any);

    const addPrescriptionFormMock = jest.spyOn(component as any, 'addPrescriptionForm');

    component.addPrescription();

    expect(addPrescriptionFormMock).toHaveBeenCalledWith(templateCode);

    getTemplates(templateCode)
  });

  it('should not call addPrescriptionForm when result is null', () => {
    createFixture('mockPseudomizedKey');
    const openDialogSpy = jest.spyOn(dialog, 'open');

    const dialogRefMock = {beforeClosed: jest.fn().mockReturnValue(of(null))};
    openDialogSpy.mockReturnValue(dialogRefMock as any);

    const addPrescriptionFormMock = jest.spyOn(component as any, 'addPrescriptionForm');

    component.addPrescription();

    expect(addPrescriptionFormMock).not.toHaveBeenCalled();
  });


  it('should open the confirmation dialog with correct data', () => {
    createFixture('mockPseudomizedKey');
    const openDialogSpy = jest.spyOn(dialog, 'open');
    const form: CreatePrescriptionForm = {} as any;
    const templateName = 'Test Template';
    const dialogRefMock = {beforeClosed: jest.fn().mockReturnValue(of(false))};
    openDialogSpy.mockReturnValue(dialogRefMock as any);

    component.deletePrescriptionForm({form, templateName});

    expect(openDialogSpy).toHaveBeenCalledWith(ConfirmDialog, {
      data: {
        titleLabel: 'prescription.create.deletePrescription.title',
        messageLabel: 'prescription.create.deletePrescription.message',
        cancelLabel: 'common.cancel',
        okLabel: 'common.delete',
        params: {templateName}
      }
    });
  });

  it('should not delete the form if user cancels (false)', () => {
    createFixture('mockPseudomizedKey');
    const openDialogSpy = jest.spyOn(dialog, 'open');
    const prescriptionFormUpdateSpy = jest.spyOn(component.prescriptionForms, 'update');
    const form: CreatePrescriptionForm = {} as any;
    const templateName = 'Test Template';
    const dialogRefMock = {beforeClosed: jest.fn().mockReturnValue(of(false))};
    openDialogSpy.mockReturnValue(dialogRefMock as any);

    component.deletePrescriptionForm({form, templateName});

    expect(prescriptionFormUpdateSpy).not.toHaveBeenCalled();
  });

  it('should delete the form if user confirms (true)', () => {
    createFixture('mockPseudomizedKey');
    const openDialogSpy = jest.spyOn(dialog, 'open');
    const prescriptionFormUpdateSpy = jest.spyOn(component.prescriptionForms, 'update');
    const form: CreatePrescriptionForm = {} as any;
    const templateName = 'Test Template';
    const dialogRefMock = {beforeClosed: jest.fn().mockReturnValue(of(true))};
    openDialogSpy.mockReturnValue(dialogRefMock as any);

    component.deletePrescriptionForm({form, templateName});

    expect(prescriptionFormUpdateSpy).toHaveBeenCalledWith(
      expect.any(Function)
    );
  });

  it('should remove the correct form when user confirms', () => {
    createFixture('mockPseudomizedKey');
    const openDialogSpy = jest.spyOn(dialog, 'open');
    const form1: CreatePrescriptionForm = {id: '1'} as any;
    const form2: CreatePrescriptionForm = {id: '2'} as any;
    const templateName = 'Test Template';
    const dialogRefMock = {beforeClosed: jest.fn().mockReturnValue(of(true))};
    openDialogSpy.mockReturnValue(dialogRefMock as any);

    const mockUpdateFunction = jest.fn((callback) => {
      const updatedForms = callback([form1, form2]);
      expect(updatedForms).toEqual([form2]); // Expect form1 to be deleted
    });

    component.prescriptionForms.update = mockUpdateFunction;

    component.deletePrescriptionForm({form: form1, templateName});

    expect(mockUpdateFunction).toHaveBeenCalled();
  });

  it('should open CancelCreationDialog when prescriptionForms length is greater than 1', () => {
    createFixture('mockPseudomizedKey');
    setMultiplePrescriptions();

    const openDialogSpy = jest.spyOn(dialog, 'open');
    const dialogRefMock = {beforeClosed: jest.fn().mockReturnValue(of({formsToDelete: [1]}))} as unknown as MatDialogRef<unknown, unknown>;
    openDialogSpy.mockReturnValue(dialogRefMock);

    component.cancelCreation();

    expect(openDialogSpy).toHaveBeenCalledWith(CancelCreationDialog, {
      data: {
        prescriptionForms: component.prescriptionForms()
      }
    });
  });

  it('should emit clickCancel when all forms are deleted in CancelCreationDialog', () => {
    createFixture('mockPseudomizedKey');
    setMultiplePrescriptions();

    const componentClickCancelEmit = jest.spyOn(component.clickCancel, 'emit');

    const openDialogSpy = jest.spyOn(dialog, 'open');
    const dialogRefMock = {beforeClosed: jest.fn().mockReturnValue(of({formsToDelete: [1, 2]}))} as unknown as MatDialogRef<unknown, unknown>;
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
    const dialogRefMock = {beforeClosed: jest.fn().mockReturnValue(of({formsToDelete: [1]}))} as unknown as MatDialogRef<unknown, unknown>;
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
    const dialogRefMock = {beforeClosed: jest.fn().mockReturnValue(of({formsToDelete: []}))} as unknown as MatDialogRef<unknown, unknown>;
    openDialogSpy.mockReturnValue(dialogRefMock);

    component.cancelCreation();

    expect(openDialogSpy).toHaveBeenCalled();
    expect(componentClickCancelEmitSpy).not.toHaveBeenCalled();
    expect(componentPrescriptionFormsUpdateSpy).not.toHaveBeenCalled();
  });

  it('should open ConfirmDialog and emit clickCancel when prescriptionForms length is 1', () => {
    createFixture('mockPseudomizedKey');
    const componentClickCancelEmitSpy = jest.spyOn(component.clickCancel, 'emit');

    const openDialogSpy = jest.spyOn(dialog, 'open');
    setOnePrescription();

    const dialogRefMock = {beforeClosed: jest.fn().mockReturnValue(of(true))} as unknown as MatDialogRef<unknown, unknown>;
    openDialogSpy.mockReturnValue(dialogRefMock);

    component.cancelCreation();

    expect(openDialogSpy).toHaveBeenCalledWith(ConfirmDialog, {
      data: {
        messageLabel: 'prescription.create.cancelCreation',
        cancelLabel: 'common.close',
        okLabel: 'common.confirm'
      }
    });
    expect(componentClickCancelEmitSpy).toHaveBeenCalled();
  });

  it('should reset the errorCard properties when closeErrorCard is called', () => {
    createFixture('mockPseudomizedKey');
    component.errorCard = {
      show: true,
      message: 'Some error occurred',
      errorResponse: { error: 'Some error details' } as HttpErrorResponse
    };

    component.closeErrorCard();

    expect(component.errorCard).toEqual({
      show: false,
      message: '',
      errorResponse: undefined
    });
  });

  it('should return initialPrescription unchanged if extend is false', () => {
    createFixture('mockPseudomizedKey');
    component.extend = false;
    const prescription: ReadPrescription = {
      authoredOn: '',
      organizationTasks: [],
      patientIdentifier: '',
      performerTasks: [],
      period: {end: '', start: ''},
      referralTask: {} as ReferralTask,
      templateCode: '',
      id: '123',
      responses: {}
    };

    const result = component.updateResponses(prescription);

    expect(result).toBe(prescription);
  });

  it('should return initialPrescription unchanged if responses is undefined', () => {
    createFixture('mockPseudomizedKey');
    component.extend = true;
    const prescription: ReadPrescription = {
      authoredOn: '',
      organizationTasks: [],
      patientIdentifier: '',
      performerTasks: [],
      period: {end: '', start: ''},
      referralTask: {} as ReferralTask,
      templateCode: '',
      id: '123',
      responses: undefined as unknown as Record<string, any>
    };

    const result = component.updateResponses(prescription);

    expect(result).toBe(prescription);
  });

  it('should return initialPrescription unchanged if prescriptionOriginId already exists', () => {
    createFixture('mockPseudomizedKey');
    component.extend = true;
    const prescription: ReadPrescription = {
      authoredOn: '',
      organizationTasks: [],
      patientIdentifier: '',
      performerTasks: [],
      period: {end: '', start: ''},
      referralTask: {} as ReferralTask,
      templateCode: '',
      id: '123',
      responses: {prescriptionOriginId: '456'}
    };

    const result = component.updateResponses(prescription);

    expect(result).toBe(prescription);
  });

  it('should return initialPrescription unchanged if initialPrescription.id is undefined', () => {
    createFixture('mockPseudomizedKey');
    component.extend = true;
    const prescription: ReadPrescription = {
      authoredOn: '',
      organizationTasks: [],
      patientIdentifier: '',
      performerTasks: [],
      period: {end: '', start: ''},
      referralTask: {} as ReferralTask,
      templateCode: '',
      id: undefined as unknown as string,
      responses: {}
    };

    const result = component.updateResponses(prescription);

    expect(result).toBe(prescription);
  });

  it('should set prescriptionOriginId to initialPrescription.id when conditions are met', () => {
    createFixture('mockPseudomizedKey');
    component.extend = true;
    const prescription: ReadPrescription = {
      authoredOn: '',
      organizationTasks: [],
      patientIdentifier: '',
      performerTasks: [],
      period: {end: '', start: ''},
      referralTask: {} as ReferralTask,
      templateCode: '',
      id: '123',
      responses: {}
    };

    const result = component.updateResponses(prescription);

    expect(result?.responses?.['prescriptionOriginId']).toBe('123');
  });

  it('should return original responses if template is not found', (done) => {
    createFixture('mockPseudomizedKey');
    jest.spyOn(component as any, 'getPrescriptionTemplateStream').mockReturnValue(() => null);

    const responses = {field1: 'value1'};
    component.encryptFreeTextInResponsesExtended('templateCode', responses).subscribe(result => {
      expect(result).toEqual(responses);
      done();
    });
  });

  it('should return original responses if cryptoKey is missing', (done) => {
    createFixture('mockPseudomizedKey');
    jest.spyOn(component as any, 'getPrescriptionTemplateStream').mockReturnValue(() => ({data: {elements: []}}));
    component.cryptoKey = undefined;

    const responses = {field1: 'value1'};
    component.encryptFreeTextInResponsesExtended('templateCode', responses).subscribe(result => {
      expect(result).toEqual(responses);
      done();
    });
  });

  it('should encrypt only fields marked as freeText', (done) => {
    createFixture('mockPseudomizedKey');
    component.cryptoKey = 'test-cryptoKey' as unknown as CryptoKey;
    jest.spyOn(component as any, 'getPrescriptionTemplateStream').mockReturnValue(() => ({
      data: {
        elements: [
          {id: 'field1', tags: ['freeText']},
          {id: 'field2', tags: []}
        ]
      }
    }));

    mockEncryptionService.encryptText.mockReturnValue(of('encrypted-value1'));

    const responses = {field1: 'value1', field2: 'value2'};
    component.encryptFreeTextInResponsesExtended('templateCode', responses).subscribe(result => {
      expect(result).toEqual({field1: 'encrypted-value1', field2: 'value2'});
      expect(mockEncryptionService.encryptText).toHaveBeenCalledWith('test-cryptoKey', 'value1');
      done();
    });
  });

  it('should handle encryption errors gracefully', (done) => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    createFixture('mockPseudomizedKey');
    component.cryptoKey = 'test-cryptoKey' as unknown as CryptoKey;
    jest.spyOn(component as any, 'getPrescriptionTemplateStream').mockReturnValue(() => ({
      data: {
        elements: [{id: 'field1', tags: ['freeText']}]
      }
    }));

    const mockError = new Error('Encryption failed');
    mockEncryptionService.encryptText.mockReturnValue(throwError(() => mockError));

    const responses = {field1: 'value1'};
    component.encryptFreeTextInResponsesExtended('templateCode', responses).subscribe(result => {
      expect(result).toEqual({field1: 'value1'});
      done();
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error encrypting key "field1":', mockError);
  });

  it('should encrypt multiple freeText fields', (done) => {
    createFixture('mockPseudomizedKey');
    component.cryptoKey = 'test-cryptoKey' as unknown as CryptoKey;
    jest.spyOn(component as any, 'getPrescriptionTemplateStream').mockReturnValue(() => ({
      data: {
        elements: [
          {id: 'field1', tags: ['freeText']},
          {id: 'field2', tags: ['freeText']},
          {id: 'field3', tags: []}
        ]
      }
    }));

    mockEncryptionService.encryptText
      .mockImplementation((key, value) => of(`encrypted-${value}`));

    const responses = {field1: 'value1', field2: 'value2', field3: 'value3'};
    component.encryptFreeTextInResponsesExtended('templateCode', responses).subscribe(result => {
      expect(result).toEqual({
        field1: 'encrypted-value1',
        field2: 'encrypted-value2',
        field3: 'value3' // Not encrypted
      });
      done();
    });
  });

  it('should show success toast and emit event when all operations succeed', () => {
    createFixture('mockPseudomizedKey');
    const toasterSpy = jest.spyOn(toaster, 'show');
    const emitPrescriptionCreated = jest.spyOn(component.prescriptionsCreated, 'emit');

    const results = [
      {trackId: 1, status: LoadingStatus.SUCCESS},
      {trackId: 2, status: LoadingStatus.SUCCESS}
    ];

    component.intent = 'order';
    component.handleCreateBulkResultExtended(results);

    expect(toasterSpy).toHaveBeenCalledWith(
      'prescription.create.allSuccess',
      {interpolation: {count: 2}}
    );
    expect(emitPrescriptionCreated).toHaveBeenCalled();
  });

  it('should show error card and update statuses when all operations fail', () => {
    createFixture('mockPseudomizedKey');
    const results = [
      {trackId: 1, status: LoadingStatus.ERROR, error: 'Error 1'},
      {trackId: 2, status: LoadingStatus.ERROR, error: 'Error 2'}
    ];

    const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {
    });
    const prescriptionFormsUpdateSpy = jest.spyOn(component.prescriptionForms, 'update');
    const componentLoadingSetSpy = jest.spyOn(component.loading, 'set');

    component.intent = 'order';
    component.handleCreateBulkResultExtended(results);

    expect(component.errorCard).toEqual({
      show: true,
      message: 'prescription.create.allFailed',
      translationOptions: {count: 2},
      errorResponse: undefined
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
      {trackId: 1, status: LoadingStatus.ERROR, error: 'Error 1'},
      {trackId: 2, status: LoadingStatus.ERROR, error: 'Error 2'}
    ];

    const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {
    });
    const prescriptionFormsUpdateSpy = jest.spyOn(component.prescriptionForms, 'update');
    const componentLoadingSetSpy = jest.spyOn(component.loading, 'set');

    component.intent = 'proposal';
    component.handleCreateBulkResultExtended(results);

    expect(component.errorCard).toEqual({
      show: true,
      message: 'proposal.create.allFailed',
      translationOptions: {count: 2},
      errorResponse: undefined
    });

    expect(prescriptionFormsUpdateSpy).toHaveBeenCalled();
    expect(consoleErrorMock).toHaveBeenCalledTimes(2); // Expect 2 errors
    expect(consoleErrorMock).toHaveBeenCalledWith(0, 'Error 1');
    expect(consoleErrorMock).toHaveBeenCalledWith(1, 'Error 2');
    expect(componentLoadingSetSpy).toHaveBeenCalledWith(false);

    consoleErrorMock.mockRestore();
  });

  it('should show mixed success message when some succeed and some fail', () => {
    createFixture('mockPseudomizedKey');
    const results = [
      {trackId: 1, status: LoadingStatus.SUCCESS},
      {trackId: 2, status: LoadingStatus.ERROR, error: 'Error 2'}
    ];

    const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {
    });
    const prescriptionFormsUpdateSpy = jest.spyOn(component.prescriptionForms, 'update');
    const componentLoadingSetSpy = jest.spyOn(component.loading, 'set');

    component.intent = 'order';
    component.handleCreateBulkResultExtended(results);

    expect(component.errorCard).toEqual({
      show: true,
      message: 'prescription.create.someSuccessSomeFailed',
      translationOptions: {successCount: 1, failedCount: 1},
      errorResponse: undefined
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
      {trackId: 1, status: LoadingStatus.SUCCESS},
      {trackId: 2, status: LoadingStatus.ERROR, error: 'Error 2'}
    ];

    const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {
    });

    component.intent = 'proposal';
    component.handleCreateBulkResultExtended(results);

    expect(component.errorCard).toEqual({
      show: true,
      message: 'proposal.create.someSuccessSomeFailed',
      translationOptions: {successCount: 1, failedCount: 1},
      errorResponse: undefined
    });

    expect(consoleErrorMock).toHaveBeenCalledTimes(1);
    expect(consoleErrorMock).toHaveBeenCalledWith(1, 'Error 2');

    consoleErrorMock.mockRestore();
  });

  const createFixture = (pseudomizedKey?: string) => {
    fixture = TestBed.createComponent(CreatePrescriptionExtendedWebComponent);
    component = fixture.componentInstance;
    component.generatedUUID = '123e4567-e89b-12d3-a456-426614174000';
    component.pseudomizedKey = pseudomizedKey;
    component.intent = 'order';

    if (pseudomizedKey) {
      jest.spyOn(pseudoService, 'byteArrayToValue').mockReturnValue({pseudonymize: jest.fn()} as unknown as Value);
      jest.spyOn(pseudoService, 'pseudonymizeValue').mockReturnValue(Promise.resolve('mockPseudomizedKey'));
    }

    fixture.detectChanges();
  }

  const getPatient = (ssin: string, person: Person) => {
    const req = httpMock.expectOne(`/persons/${ssin}`);
    expect(req.request.method).toBe('GET');
    req.flush(person);
  }

  const getTemplates = (templateCode: string) => {
    const req = httpMock.expectOne(`/templates/${templateCode}/versions/latest`);
    expect(req.request.method).toBe('GET');
    req.flush({status: 200});
  }

  const setOnePrescription = () => {
    component.prescriptionForms.set([{
      elementGroup: {
        markAllAsTouched: jest.fn(),
        valid: true,
        getOutputValue: jest.fn(),
      } as unknown as ElementGroup,
      submitted: false
    } as unknown as CreatePrescriptionForm]);
  }

  const setMultiplePrescriptions = () => {
    component.prescriptionForms.set([{
      elementGroup: {
        markAllAsTouched: jest.fn(),
        valid: true,
        getOutputValue: jest.fn(),
      } as unknown as ElementGroup,
      submitted: false
    } as unknown as CreatePrescriptionForm, {
      elementGroup: {
        markAllAsTouched: jest.fn(),
        valid: true,
        getOutputValue: jest.fn(),
      } as unknown as ElementGroup,
      submitted: false
    } as unknown as CreatePrescriptionForm]);
  }
})
