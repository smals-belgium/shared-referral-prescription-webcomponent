import {
  PrescriptionDetailsWebComponent
} from '../../../../wc-prescription-details/src/components/prescription-details/prescription-details.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MatNativeDateModule } from '@angular/material/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { importProvidersFrom, SimpleChange, SimpleChanges } from '@angular/core';
import { ConfigurationService } from '@reuse/code/services/configuration.service';
import { AuthService } from '@reuse/code/services/auth.service';
import { PseudonymisationHelper } from '@smals-belgium-shared/pseudo-helper/dist';
import { ListPrescriptionsWebComponent } from './list-prescriptions.component';
import { Observable, of } from 'rxjs';
import { LoadingStatus } from '@reuse/code/interfaces';
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

describe('ListPrescriptionsWebComponent', () => {
  let component: ListPrescriptionsWebComponent;
  let fixture: ComponentFixture<ListPrescriptionsWebComponent>;
  let httpMock: HttpTestingController;


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
    fixture = TestBed.createComponent(ListPrescriptionsWebComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  })

  afterEach(() => {
    httpMock.verify();
  });


  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it('should call loadPrescriptions if intent is order', async () => {
    const loadDataSpy = jest.spyOn(component, 'loadData');
    const loadPrescriptionsSpy = jest.spyOn(component, 'loadPrescriptions');
    const ssin = 'ssin';
    component.intent = 'order';

    const simpleChanges: SimpleChanges = {patientSsin: new SimpleChange('', ssin, true)}
    component.patientSsin = ssin;
    component.ngOnChanges(simpleChanges);

    expect(loadDataSpy).toHaveBeenCalledWith(1);
    expect(loadPrescriptionsSpy).toHaveBeenCalledWith(1, undefined);

    jest.spyOn(component['prescriptionsState'], 'loadPrescriptions').mockReturnValue()
  });

  it('should display a table when viewStatePrescriptions$ has data and state success', async () => {
    const {debugElement} = fixture;
    let prescriptionTable = debugElement.query(By.css('app-prescriptions-table'));
    expect(prescriptionTable).toBeNull();

    component.intent = 'order';
    component.viewStatePrescriptions$().data = {
      prescriptions: {} as PrescriptionSummaryList,
      templates: [],
      proposals: {} as PrescriptionSummaryList
    };
    component.viewStatePrescriptions$().status = LoadingStatus.SUCCESS;

    fixture.detectChanges();

    prescriptionTable = debugElement.query(By.css('app-prescriptions-table')).nativeElement;
    expect(prescriptionTable).toBeTruthy();
  });

  it('should call loadProposals if intent is proposal', () => {
    const loadDataSpy = jest.spyOn(component, 'loadData');
    const loadProposalsSpy = jest.spyOn(component, 'loadProposals');
    const ssin = 'ssin';
    component.intent = 'proposal';

    const simpleChanges: SimpleChanges = {patientSsin: new SimpleChange('', ssin, true)}
    component.patientSsin = ssin;
    component.ngOnChanges(simpleChanges);

    expect(loadDataSpy).toHaveBeenCalledWith(1);
    expect(loadProposalsSpy).toHaveBeenCalledWith(1, undefined);

    jest.spyOn(component['proposalsState'], 'loadProposals').mockReturnValue()
  });
});
