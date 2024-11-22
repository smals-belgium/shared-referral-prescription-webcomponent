import { PrescriptionDetailsWebComponent } from "./prescription-details.component";
import { ComponentFixture, fakeAsync, TestBed, tick } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { HttpClientTestingModule, HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { provideRouter } from "@angular/router";
import { TranslateLoader, TranslateModule } from "@ngx-translate/core";
import { Observable, of } from "rxjs";
import { DateAdapter, MatNativeDateModule } from "@angular/material/core";
import { ConfigurationService } from "@reuse/code/services/configuration.service";
import { AuthService } from "@reuse/code/services/auth.service";
import { By } from "@angular/platform-browser";
import { importProvidersFrom, SimpleChanges } from "@angular/core";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { AssignPrescriptionDialog } from "@reuse/code/dialogs/assign-prescription/assign-prescription.dialog";
import { CancelPrescriptionDialog } from "@reuse/code/dialogs/cancel-prescription/cancel-prescription.dialog";
import {
  StartExecutionPrescriptionDialog
} from "@reuse/code/dialogs/start-execution-prescription/start-execution-prescription.dialog";
import { PerformerTask, ReadPrescription, Status, TaskStatus } from "@reuse/code/interfaces";
import { TransferAssignationDialog } from '@reuse/code/dialogs/transfer-assignation/transfer-assignation.dialog';
import {
  RestartExecutionPrescriptionDialog
} from '@reuse/code/dialogs/restart-execution-prescription/restart-execution-prescription.dialog';
import {
  FinishExecutionPrescriptionDialog
} from '@reuse/code/dialogs/finish-execution-prescription/finish-execution-prescription.dialog';
import {
  CancelExecutionPrescriptionDialog
} from '@reuse/code/dialogs/cancel-execution-prescription/cancel-execution-prescription.dialog';
import {
  InterruptExecutionPrescriptionDialog
} from '@reuse/code/dialogs/interrupt-execution-prescription/interrupt-execution-prescription.dialog';
import { RejectAssignationDialog } from '@reuse/code/dialogs/reject-assignation/reject-assignation.dialog';
import { ToastService } from '@reuse/code/services/toast.service';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { PseudonymisationHelper } from '@smals-belgium-shared/pseudo-helper/dist';

const mockTemplate = {
  "id": 39,
  "version": "1",
  "commonTranslationsId": 1,
  "extraData": {
    "welcome": {
      "en": "Template 8 : Sampling",
      "nl": "Template 8 : Staalname",
      "fr": "Template 8 : Échantillon"
    }
  },
  "elements": [{
    "id": "occurrenceTiming",
    "dataType": {
      "type": "object"
    },
    "viewType": "occurrenceTiming",
    "labelTranslationId": "frequencyRow"
  }, {
    "id": "nbSessions",
    "dataType": {
      "type": "number"
    },
    "viewType": "number",
    "labelTranslationId": "nbSessions",
    "placeholderTranslationId": "nbSessionsPlaceholder"
  }, {
    "id": "sampleType",
    "dataType": {
      "type": "string"
    },
    "viewType": "select",
    "labelTranslationId": "sampleType",
    "responses": [{
      "value": "45710003",
      "labelTranslationId": "sputum"
    }, {
      "value": "78014005",
      "labelTranslationId": "urine"
    }, {
      "value": "87612001",
      "labelTranslationId": "blood"
    }, {
      "value": "39477002",
      "labelTranslationId": "feces"
    }, {
      "value": "247450001",
      "labelTranslationId": "woundFluid"
    }, {
      "value": "410582009",
      "labelTranslationId": "nasalFluid"
    }, {
      "value": "256897009",
      "labelTranslationId": "saliva"
    }, {
      "value": "otherSampleType",
      "labelTranslationId": "otherSampleType"
    }]
  }, {
    "id": "sampleTypeOther",
    "dataType": {
      "type": "string"
    },
    "viewType": "inputText",
    "skipIf": {
      "leftValue": "${responses:sampleType}",
      "operator": "!=",
      "rightValue": "otherSampleType"
    }
  }, {
    "id": "bodyLocation",
    "dataType": {
      "type": "string"
    },
    "viewType": "select",
    "labelTranslationId": "bodyLocation",
    "responses": [{
      "value": "31640002",
      "labelTranslationId": "afterheadArea"
    }, {
      "value": "789699009",
      "labelTranslationId": "structureOfOccipitalCondyle"
    }, {
      "value": "78277001",
      "labelTranslationId": "temporalLobe"
    }, {
      "value": "69536005",
      "labelTranslationId": "head"
    }, {
      "value": "81745001",
      "labelTranslationId": "eye"
    }, {
      "value": "117590005",
      "labelTranslationId": "ear"
    }, {
      "value": "123851003",
      "labelTranslationId": "mouth"
    }, {
      "value": "45206002",
      "labelTranslationId": "nose"
    }, {
      "value": "1797002",
      "labelTranslationId": "anteriorNaris"
    }, {
      "value": "48477009",
      "labelTranslationId": "lip"
    }, {
      "value": "60819002",
      "labelTranslationId": "cheek"
    }, {
      "value": "51185008",
      "labelTranslationId": "chest"
    }, {
      "value": "113345001",
      "labelTranslationId": "belly"
    }, {
      "value": "727234005",
      "labelTranslationId": "entireBack"
    }, {
      "value": "53120007",
      "labelTranslationId": "upperLimb"
    }, {
      "value": "14975008",
      "labelTranslationId": "forearm"
    }, {
      "value": "127949000",
      "labelTranslationId": "elbow"
    }, {
      "value": "85562004",
      "labelTranslationId": "hand"
    }, {
      "value": "16982005",
      "labelTranslationId": "shoulder"
    }, {
      "value": "182281004",
      "labelTranslationId": "leg"
    }, {
      "value": "78234002",
      "labelTranslationId": "shin"
    }, {
      "value": "72696002",
      "labelTranslationId": "knee"
    }, {
      "value": "421235005",
      "labelTranslationId": "thighBone"
    }, {
      "value": "30547001",
      "labelTranslationId": "greaterTrochanter"
    }, {
      "value": "87342007",
      "labelTranslationId": "fibula"
    }, {
      "value": "360857004",
      "labelTranslationId": "structureOfMalleolusOfFibula"
    }, {
      "value": "244015008",
      "labelTranslationId": "entireCalfOfLowerLeg"
    }, {
      "value": "1376500",
      "labelTranslationId": "malleolarRegion"
    }, {
      "value": "344001",
      "labelTranslationId": "ankle"
    }, {
      "value": "76853006",
      "labelTranslationId": "heel"
    }, {
      "value": "244187005",
      "labelTranslationId": "skinOfInstepOfFoot"
    }, {
      "value": "56459004",
      "labelTranslationId": "foot"
    }, {
      "value": "78883009",
      "labelTranslationId": "bigToe"
    }, {
      "value": "55078004",
      "labelTranslationId": "secondToe"
    }, {
      "value": "78132007",
      "labelTranslationId": "thirdToe"
    }, {
      "value": "80349001",
      "labelTranslationId": "fourthToe"
    }, {
      "value": "39915008",
      "labelTranslationId": "fifthToe"
    }, {
      "value": "79601000",
      "labelTranslationId": "scapula"
    }, {
      "value": "85710004",
      "labelTranslationId": "sisticBone"
    }, {
      "value": "182034009",
      "labelTranslationId": "entireIliacCrest"
    }, {
      "value": "18911002",
      "labelTranslationId": "penis"
    }, {
      "value": "76784001",
      "labelTranslationId": "vagina"
    }, {
      "value": "53505006",
      "labelTranslationId": "anus"
    }, {
      "value": "52795006",
      "labelTranslationId": "forehead"
    }, {
      "value": "89545001",
      "labelTranslationId": "structureOfTheFace"
    }, {
      "value": "45048000",
      "labelTranslationId": "neck"
    }, {
      "value": "76505004",
      "labelTranslationId": "thumb"
    }, {
      "value": "83738005",
      "labelTranslationId": "indexFinger"
    }, {
      "value": "65531009",
      "labelTranslationId": "middleFinger"
    }, {
      "value": "82002001",
      "labelTranslationId": "ringFinger"
    }, {
      "value": "12406000",
      "labelTranslationId": "littleFinger"
    }, {
      "value": "29836001",
      "labelTranslationId": "hip"
    }, {
      "value": "68367000",
      "labelTranslationId": "thigh"
    }, {
      "value": "30021000",
      "labelTranslationId": "lowerLeg"
    }, {
      "value": "699698002",
      "labelTranslationId": "sacrum"
    }, {
      "value": "66040006",
      "labelTranslationId": "pubicBone"
    }],
    "showIf": {
      "leftValue": "${responses:sampleType}",
      "operator": "=",
      "rightValue": "247450001"
    },
    "skipIf": {
      "leftValue": "${responses:sampleType}",
      "operator": "=",
      "rightValue": "410582009"
    },
    "valueIfSkipped": "45206002"
  }, {
    "id": "bodyLaterality",
    "dataType": {
      "type": "string"
    },
    "viewType": "select",
    "labelTranslationId": "bodyLaterality",
    "responses": [{
      "value": "7771000",
      "labelTranslationId": "left",
      "skipIf": {
        "leftValue": "${responses:sampleType}",
        "operator": "=",
        "rightValue": "410582009"
      }
    }, {
      "value": "24028007",
      "labelTranslationId": "right",
      "skipIf": {
        "leftValue": "${responses:sampleType}",
        "operator": "=",
        "rightValue": "410582009"
      }
    }, {
      "value": "419161000",
      "labelTranslationId": "unilateralLeft"
    }, {
      "value": "419465000",
      "labelTranslationId": "unilateralRight"
    }, {
      "value": "51440002",
      "labelTranslationId": "bilateral"
    }, {
      "value": "261183002",
      "labelTranslationId": "atTheTopOf",
      "skipIf": {
        "leftValue": "${responses:sampleType}",
        "operator": "=",
        "rightValue": "410582009"
      }
    }, {
      "value": "261122009",
      "labelTranslationId": "atTheBottomOf",
      "skipIf": {
        "leftValue": "${responses:sampleType}",
        "operator": "=",
        "rightValue": "410582009"
      }
    }, {
      "value": "255561001",
      "labelTranslationId": "medial",
      "skipIf": {
        "leftValue": "${responses:sampleType}",
        "operator": "=",
        "rightValue": "410582009"
      }
    }, {
      "value": "49370004",
      "labelTranslationId": "lateral",
      "skipIf": {
        "leftValue": "${responses:sampleType}",
        "operator": "=",
        "rightValue": "410582009"
      }
    }, {
      "value": "264217000",
      "labelTranslationId": "superior",
      "skipIf": {
        "leftValue": "${responses:sampleType}",
        "operator": "=",
        "rightValue": "410582009"
      }
    }, {
      "value": "261089000",
      "labelTranslationId": "inferior",
      "skipIf": {
        "leftValue": "${responses:sampleType}",
        "operator": "=",
        "rightValue": "410582009"
      }
    }, {
      "value": "255551008",
      "labelTranslationId": "posteriorBack",
      "skipIf": {
        "leftValue": "${responses:sampleType}",
        "operator": "=",
        "rightValue": "410582009"
      }
    }, {
      "value": "255549009",
      "labelTranslationId": "anteriorFront",
      "skipIf": {
        "leftValue": "${responses:sampleType}",
        "operator": "=",
        "rightValue": "410582009"
      }
    }, {
      "value": "351726001",
      "labelTranslationId": "below",
      "skipIf": {
        "leftValue": "${responses:sampleType}",
        "operator": "=",
        "rightValue": "410582009"
      }
    }, {
      "value": "352730000",
      "labelTranslationId": "upstairs",
      "skipIf": {
        "leftValue": "${responses:sampleType}",
        "operator": "=",
        "rightValue": "410582009"
      }
    }, {
      "value": "260521003",
      "labelTranslationId": "internal",
      "skipIf": {
        "leftValue": "${responses:sampleType}",
        "operator": "=",
        "rightValue": "410582009"
      }
    }, {
      "value": "261074009",
      "labelTranslationId": "external",
      "skipIf": {
        "leftValue": "${responses:sampleType}",
        "operator": "=",
        "rightValue": "410582009"
      }
    }],
    "showIf": {
      "operator": "or",
      "conditions": [{
        "leftValue": "${responses:sampleType}",
        "operator": "=",
        "rightValue": "247450001"
      }, {
        "leftValue": "${responses:sampleType}",
        "operator": "=",
        "rightValue": "410582009"
      }]
    }
  }, {
    "id": "feedback",
    "dataType": {
      "type": "boolean"
    },
    "viewType": "radio",
    "labelTranslationId": "feedback",
    "responses": [{
      "value": true,
      "labelTranslationId": "yes"
    }, {
      "value": false,
      "labelTranslationId": "no"
    }]
  }, {
    "id": "diagnosis",
    "dataType": {
      "type": "string"
    },
    "viewType": "textarea",
    "labelTranslationId": "diagnosis"
  }, {
    "id": "medicalReason",
    "dataType": {
      "type": "string"
    },
    "viewType": "textarea",
    "labelTranslationId": "medicalReason"
  }, {
    "id": "contraindications",
    "dataType": {
      "type": "string"
    },
    "viewType": "textarea",
    "labelTranslationId": "contraindications"
  }, {
    "id": "generalRemarks",
    "dataType": {
      "type": "string"
    },
    "viewType": "textarea",
    "labelTranslationId": "generalRemarks"
  }],
  "translations": {},
  "commonTranslations": {}
}

const mockPerformerTask: PerformerTask = {
  "status": TaskStatus.READY,
  "id": "345",
  "executionPeriod": {
    "start": undefined,
    "end": undefined
  },
  "careGiverSsin": "85011300242",
  "careGiver": {
    "nihdi": "45369373428",
    "address": {},
    "ssin": "85011300242",
    "firstName": "Ann",
    "lastName": "Verhofstadt",
    "profession": "NURSE",
    "type": "Professional"
  }
}

const organisationTask = {
  "status": "INPROGRESS",
  "id": "234",
  "executionPeriod": null,
  "organizationNihdi": "94478790940",
  "organization": {
    "nihdi": "94478790940",
    "address": {},
    "cbe": "0632837205",
    "name": "Cabinet Infirmier Grégoire",
    "institutionTypeCode": "940",
    "type": "Organization"
  },
  "performerTasks": [mockPerformerTask],
  "lastModified": null
}

const referralTask = {
  id: "455"
}

function prescriptionResponse(organisationTasks: any = null, referralTask: any = null, performerTask: PerformerTask[] | null = null) {
  return {
    "id": "123",
    "patientIdentifier": "90122712173",
    "referralTask": referralTask,
    "performerTasks": performerTask,
    "organizationTasks": organisationTasks,
    "templateCode": "GENERIC",
    "authoredOn": "2024-09-04T22:00:00.000+00:00",
    "requester": {
      "nihdi": "46843080401",
      "address": {
        "streetName": null,
        "houseNumber": null,
        "box": null,
        "zipCode": "8000",
        "city": "Brugge",
        "cityCode": null,
        "countryCode": null,
        "country": null
      },
      "ssin": "72101230445",
      "firstName": "Geneviève",
      "lastName": "Boudart",
      "profession": "NURSE",
      "type": "Professional"
    },
    "status": "OPEN",
    "period": {
      "start": "2024-09-04T22:00:00.000+00:00",
      "end": "2025-09-03T22:00:00.000+00:00"
    },
    "responses": {
      "feedback": false,
      "diagnosis": "diagnose test 8",
      "occurrenceTiming": {
        "repeat": {
          "count": 12,
          "frequency": 1,
          "period": 1,
          "periodUnit": "wk"
        }
      },
      "careType": "17636008"
    },
    "intent": null
  }
}

class FakeLoader implements TranslateLoader {
  getTranslation(lang: string): Observable<any> {
    return of({});
  }
}

const mockConfigService = {
  getEnvironment: jest.fn(),
  getEnvironmentVariable: jest.fn()
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

function MockPseudoHelperFactory() { return new PseudonymisationHelper(mockPseudoClient) }

describe('PrescriptionDetailsWebComponent', () => {
  let component: PrescriptionDetailsWebComponent;
  let fixture: ComponentFixture<PrescriptionDetailsWebComponent>;
  let httpMock: HttpTestingController;
  let dialog: MatDialog
  let toaster: ToastService

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrescriptionDetailsWebComponent, TranslateModule.forRoot({
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
        {provide: PseudonymisationHelper, useValue: MockPseudoHelperFactory()}
      ],
    })
      .compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    dialog = TestBed.inject(MatDialog);
    toaster = TestBed.inject(ToastService);
  })

  afterEach(() => {
    httpMock.verify();
  });


  it('should create the app', () => {
    createFixture()
    expect(component).toBeTruthy();
  });

  it('should show the loading state', () => {
    createFixture()
    component.loading = true
    fixture.detectChanges()
    const {debugElement} = fixture;

    const loader = debugElement.query(By.css('app-overlay-spinner'));
    expect(loader).toBeTruthy();
  });

  it('should load a prescription', async () => {
    createFixture()
    const mockResponse = prescriptionResponse()
    await loadPrescription(mockResponse)

    const {debugElement} = fixture;
    const divWithClassId = debugElement.query(By.css('.id')).nativeElement;
    expect(divWithClassId.textContent).toContain(mockResponse.id);

    const h2 = debugElement.query(By.css('h2')).nativeElement;
    expect(h2.textContent).toContain(mockResponse.templateCode);
  });

  it('should request the persons call when user is professional', async () => {
    mockAuthService.isProfessional.mockImplementationOnce(() => of(true))
    createFixture()

    const mockResponse = prescriptionResponse()
    await loadPrescription(mockResponse)

    const req = httpMock.expectOne('/persons/90122712173');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('should display the error card', async () => {
    createFixture()
    mockConfigService.getEnvironmentVariable.mockImplementationOnce(() => false)
    component.prescriptionId = "123"
    const changes = {
      prescriptionId: "123"
    }

    component.ngOnChanges(changes as unknown as SimpleChanges)
    fixture.detectChanges()

    const req = httpMock.expectOne('/prescriptions/123');
    req.error(new ProgressEvent('error'), {status: 401});

    fixture.detectChanges()

    const {debugElement} = fixture;
    const errorCard = debugElement.query(By.css('app-error-card'));
    expect(errorCard).toBeTruthy();
  });

  it('should load templates and the access matrix when the token changes', async () => {
    createFixture()
    mockConfigService.getEnvironmentVariable.mockImplementationOnce(() => false)
    const tokenFn = jest.fn()
    component.getToken = tokenFn
    const changes = {
      getToken: tokenFn
    }

    component.ngOnChanges(changes as unknown as SimpleChanges)
    fixture.detectChanges()

    const accessReq = httpMock.expectOne('/accessMatrix');
    expect(accessReq.request.method).toBe('GET');

    const templateReq = httpMock.expectOne('/templates');
    expect(templateReq.request.method).toBe('GET');
  });

  it('should open the dialogs when functions are called', fakeAsync (() => {
    createFixture()
    const openDialogSpy = jest.spyOn(dialog, 'open');

    const mockResponse = prescriptionResponse([organisationTask], referralTask, [mockPerformerTask]) as unknown as ReadPrescription

    const prescriptionTaskPatient = {
      prescription: mockResponse,
      performerTask: mockPerformerTask,
      patient: mockPerson
    }

    const prescriptionTaskExecutionDate = {
      prescription: mockResponse,
      performerTask: mockPerformerTask,
      startExecutionDate: mockPerformerTask.executionPeriod?.start
    }

    const prescriptionTaskCaregiver = {
      prescriptionId: mockResponse.id,
      referralTaskId: referralTask.id,
      assignedCareGivers: [mockPerformerTask.careGiverSsin],
    }

    //openAssignDialog
    component.openAssignDialog(mockResponse);

    const paramsAssign = {
      data: {
        ...prescriptionTaskCaregiver,
        assignedOrganizations: [organisationTask.organizationNihdi]
      },
      width: '100vw',
      maxWidth: '750px',
      maxHeight: '100vh'
    }

    expect(openDialogSpy).toHaveBeenCalledTimes(1);
    expect(openDialogSpy).toHaveBeenCalledWith(AssignPrescriptionDialog, paramsAssign);

    tick()
    httpMock.expectOne('/healthCareProviders?discipline=NURSE&institutionType=THIRD_PARTY_PAYING_GROUP,GUARD_POST,MEDICAL_HOUSE,HOME_SERVICES')

    // openTransferAssignationDialog
    component.openTransferAssignationDialog(mockResponse, mockPerformerTask)

    const paramsTransfer = {
      data: {
        ...prescriptionTaskCaregiver,
        performerTaskId: mockPerformerTask.id,
      },
      width: '100vw',
      maxWidth: '750px',
      maxHeight: '100vh'
    }

    expect(openDialogSpy).toHaveBeenCalledTimes(2);
    expect(openDialogSpy).toHaveBeenCalledWith(TransferAssignationDialog, paramsTransfer);

    // openCancelPrescriptionDialog
    component.openCancelPrescriptionDialog(mockResponse, mockPerson)

    const paramsCancel = {
      data: {
        prescription: mockResponse,
        patient: mockPerson
      },
      width: '100vw',
      maxWidth: '500px'
    }

    expect(openDialogSpy).toHaveBeenCalledTimes(3);
    expect(openDialogSpy).toHaveBeenCalledWith(CancelPrescriptionDialog, paramsCancel);

    //openStartExecutionDialog
    component.openStartExecutionDialog(mockResponse)

    const paramsStartExecution = {
      data: {
        prescription: mockResponse,
        performerTask: undefined,
        startExecutionDate: undefined
      },
      minWidth: '320px'
    }

    expect(openDialogSpy).toHaveBeenCalledTimes(4);
    expect(openDialogSpy).toHaveBeenCalledWith(StartExecutionPrescriptionDialog, paramsStartExecution);

    //openStartExecutionDialog with task
    component.openStartExecutionDialog(mockResponse, mockPerformerTask)

    const paramsStartExecutionWithTask = {
      data: prescriptionTaskExecutionDate,
      minWidth: '320px'
    }

    expect(openDialogSpy).toHaveBeenCalledTimes(5);
    expect(openDialogSpy).toHaveBeenCalledWith(StartExecutionPrescriptionDialog, paramsStartExecutionWithTask);

    // openRestartExecutionDialog
    component.openRestartExecutionDialog(mockResponse, mockPerformerTask, mockPerson)

    const paramsRestartExecution = {
      data: prescriptionTaskPatient,
      minWidth: '320px'
    }

    expect(openDialogSpy).toHaveBeenCalledTimes(6);
    expect(openDialogSpy).toHaveBeenCalledWith(RestartExecutionPrescriptionDialog, paramsRestartExecution);

    // openFinishExecutionDialog
    component.openFinishExecutionDialog(mockResponse, mockPerformerTask)

    const paramsFinishExecution = {
      data: prescriptionTaskExecutionDate,
      minWidth: '320px'
    }

    expect(openDialogSpy).toHaveBeenCalledTimes(7);
    expect(openDialogSpy).toHaveBeenCalledWith(FinishExecutionPrescriptionDialog, paramsFinishExecution);

    // openCancelExecutionDialog
    component.openCancelExecutionDialog(mockResponse, mockPerformerTask, mockPerson)

    const paramsCancelExecution = {
      data: prescriptionTaskPatient,
      width: '100vw',
      maxWidth: '500px'
    }

    expect(openDialogSpy).toHaveBeenCalledTimes(8);
    expect(openDialogSpy).toHaveBeenCalledWith(CancelExecutionPrescriptionDialog, paramsCancelExecution);

    // openInterruptExecutionDialog
    component.openInterruptExecutionDialog(mockResponse, mockPerformerTask, mockPerson)

    const paramsInterruptExecution = {
      data: prescriptionTaskPatient,
      width: '100vw',
      maxWidth: '500px'
    }

    expect(openDialogSpy).toHaveBeenCalledTimes(9);
    expect(openDialogSpy).toHaveBeenCalledWith(InterruptExecutionPrescriptionDialog, paramsInterruptExecution);

    // openRejectAssignationDialog
    component.openRejectAssignationDialog(mockResponse, mockPerformerTask, mockPerson)

    const paramsRejectExecution = {
      data: prescriptionTaskPatient,
      width: '100vw',
      maxWidth: '500px'
    }

    expect(openDialogSpy).toHaveBeenCalledTimes(10);
    expect(openDialogSpy).toHaveBeenCalledWith(RejectAssignationDialog, paramsRejectExecution);
  }));

  it('should show a toaster when you selfAssign is called successfully', async () => {
    createFixture()
    const toasterSpy = jest.spyOn(toaster, 'show');

    const mockResponse = prescriptionResponse([organisationTask], referralTask) as unknown as ReadPrescription

    expect(component.loading).toBe(false)

    component.selfAssign(mockResponse)
    expect(component.loading).toBe(true)

    const body = {
      ssin: mockPerson.ssin,
      role: 'NURSE',
      executionStartDate: undefined
    };
    const req = httpMock.expectOne(`/prescriptions/${mockResponse.id}/assign/${referralTask.id}`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toStrictEqual(body)
    req.flush({});

    prescriptionRequest({})

    expect(component.loading).toBe(false)
    expect(toasterSpy).toHaveBeenCalledTimes(1)
    expect(toasterSpy).toHaveBeenCalledWith('prescription.assignPerformer.meSuccess')

    await Promise.resolve();
    httpMock.expectOne('/templates/READ_undefined/versions/latest')
  })

  it('should call loadPrintWebComponent when printer is false', () => {
    createFixture()
    const loadPrintWebComponentSpy = jest.spyOn(PrescriptionDetailsWebComponent.prototype as any, 'loadPrintWebComponent');

    expect(component.printer).toBe(false)
    component.print()
    expect(component.printer).toBe(true)
    expect(loadPrintWebComponentSpy).toHaveBeenCalled();
  })

  it('should NOT call loadPrintWebComponent when printer is true', () => {
    createFixture()
    const loadPrintWebComponentSpy = jest.spyOn(PrescriptionDetailsWebComponent.prototype as any, 'loadPrintWebComponent');

    component.printer = true
    component.print()
    expect(loadPrintWebComponentSpy).not.toHaveBeenCalled();
  })

  it('should return the correct border color', () => {
    createFixture()
    let color = component.getStatusBorderColor(Status.BLACKLISTED)
    expect(color).toBe('red')
    color = component.getStatusBorderColor(Status.CANCELLED)
    expect(color).toBe('red')
    color = component.getStatusBorderColor(Status.EXPIRED)
    expect(color).toBe('red')

    color = component.getStatusBorderColor(Status.PENDING)
    expect(color).toBe('orange')

    color = component.getStatusBorderColor(Status.IN_PROGRESS)
    expect(color).toBe('#40c4ff')

    color = component.getStatusBorderColor(Status.DONE)
    expect(color).toBe('limegreen')

    color = component.getStatusBorderColor(Status.DRAFT)
    expect(color).toBe('lightgrey')
  })

  it('should map the responses', () => {
    createFixture()
    const responses = {
      period: {
        "start": "2024-09-19T22:00:00.000+00:00",
        "end": "2025-09-18T22:00:00.000+00:00"
      },
      responses: {
        "feedback": false,
        "parameterType": "otherParameterType",
        "otherParameterType": "tmp_other_parameter",
        "diagnosis": "test3",
        "occurrenceTiming": {
          "repeat": {
            "count": 30,
            "duration": 1,
            "durationUnit": "mo",
            "frequency": 1,
            "period": 1,
            "periodUnit": "d",
            "when": [
              "PC"
            ]
          }
        }
      }
    }

    const mockResponses = {
      "feedback": false,
      "parameterType": "otherParameterType",
      "otherParameterType": "tmp_other_parameter",
      "diagnosis": "test3",
      "occurrenceTiming": {
        "repeat": {
          "count": 30,
          "duration": 1,
          "durationUnit": "mo",
          "frequency": 1,
          "period": 1,
          "periodUnit": "d",
          "when": [
            "PC"
          ]
        }
      },
      "count": 30,
      "duration": 1,
      "durationUnit": "mo",
      "frequency": 1,
      "period": 1,
      "periodUnit": "d",
      "when": [
        "PC"
      ],
      "validityStartDate": "2024-09-19T22:00:00.000+00:00",
      "validityEndDate": "2025-09-18T22:00:00.000+00:00"
    }
    const prescriptionResponses = component.mapResponses(responses)
    expect(prescriptionResponses).toEqual(mockResponses)
  })


  const loadPrescription = async (mockResponse: any) => {
    mockConfigService.getEnvironmentVariable.mockImplementationOnce(() => false)

    component.prescriptionId = "123"
    const changes = {
      prescriptionId: "123"
    }

    component.ngOnChanges(changes as unknown as SimpleChanges)
    fixture.detectChanges()

    prescriptionRequest(mockResponse);

    fixture.detectChanges()

    templateRequest()

    await Promise.resolve()
    fixture.detectChanges()
  }

  const templateRequest = () => {
    const templateRed = httpMock.expectOne('/templates/READ_GENERIC/versions/latest');
    expect(templateRed.request.method).toBe('GET');
    templateRed.flush(mockTemplate);
  }

  const prescriptionRequest = (mockResponse: any) => {
    const req = httpMock.expectOne('/prescriptions/123');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  }

  const createFixture = () => {
    fixture = TestBed.createComponent(PrescriptionDetailsWebComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

});
