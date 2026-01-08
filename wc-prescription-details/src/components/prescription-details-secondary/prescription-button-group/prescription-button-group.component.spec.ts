import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PrescriptionButtonGroupComponent } from './prescription-button-group.component';
import { PrescriptionDetailsSecondaryService } from '../prescription-details-secondary.service';
import {
  FakeLoader,
  mockPerformerTask,
  mockPro,
  prescriptionDetailsSecondaryMockService,
  prescriptionResponse,
} from '../../../../test.utils';
import { By } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AccessMatrixState } from '@reuse/code/states/api/access-matrix.state';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { FhirR4TaskStatus } from '@reuse/code/openapi';

describe('PrescriptionButtonGroupComponent', () => {
  let component: PrescriptionButtonGroupComponent;
  let fixture: ComponentFixture<PrescriptionButtonGroupComponent>;
  let mockAccessMatrixState: jest.Mocked<AccessMatrixState>;

  beforeEach(async () => {
    mockAccessMatrixState = {
      hasAtLeastOnePermission: jest.fn().mockReturnValue(true),
    } as unknown as jest.Mocked<AccessMatrixState>;

    await TestBed.configureTestingModule({
      imports: [
        PrescriptionButtonGroupComponent,
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: FakeLoader },
        }),
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PrescriptionDetailsSecondaryService, useValue: prescriptionDetailsSecondaryMockService },
        { provide: AccessMatrixState, useValue: mockAccessMatrixState },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    fixture = TestBed.createComponent(PrescriptionButtonGroupComponent);
    component = fixture.componentInstance;

    component.currentPerformerTask = mockPerformerTask;

    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should not display a button when there is no current user, nor prescription data', () => {
    fixture = TestBed.createComponent(PrescriptionButtonGroupComponent);
    component = fixture.componentInstance;

    component.currentPerformerTask = mockPerformerTask;

    fixture.detectChanges();
    const { debugElement } = fixture;
    const buttons = debugElement.queryAll(By.css('button'));
    expect(buttons.length).toBe(0);
  });

  it('should display the start excecution button when there is a current user, prescription data and the performertask is ready', () => {
    prescriptionDetailsSecondaryMockService.getCurrentUser.mockReturnValue({ data: mockPro });
    prescriptionDetailsSecondaryMockService.getPatient.mockReturnValue({ data: mockPro });

    prescriptionDetailsSecondaryMockService.getPrescription.mockReturnValue({ data: prescriptionResponse() });
    prescriptionDetailsSecondaryMockService.getPerformerTask.mockReturnValue({ data: mockPerformerTask });

    const fixture = TestBed.createComponent(PrescriptionButtonGroupComponent);
    const component = fixture.componentInstance;
    component.currentPerformerTask = mockPerformerTask;
    fixture.detectChanges();

    const { debugElement } = fixture;
    const buttons = debugElement.queryAll(By.css('button'));
    expect(buttons.length).toBe(1);
    expect(buttons[0].nativeElement.textContent).toContain('prescription.startExecution.action');
  });

  it('should display the finish excecution button when there is a current user, prescription data and the performertask is in progress, but current user ssin is NOT the same as task caregiver ssin', () => {
    prescriptionDetailsSecondaryMockService.getCurrentUser.mockReturnValue({ data: mockPro });
    prescriptionDetailsSecondaryMockService.getPatient.mockReturnValue({ data: mockPro });

    mockPerformerTask.status = FhirR4TaskStatus.Inprogress;

    prescriptionDetailsSecondaryMockService.getPrescription.mockReturnValue({
      data: prescriptionResponse(null, null, [mockPerformerTask]),
    });
    prescriptionDetailsSecondaryMockService.getPerformerTask.mockReturnValue({ data: mockPerformerTask });

    const fixture = TestBed.createComponent(PrescriptionButtonGroupComponent);
    const component = fixture.componentInstance;
    component.currentPerformerTask = mockPerformerTask;
    fixture.detectChanges();

    const { debugElement } = fixture;
    const buttons = debugElement.queryAll(By.css('button'));
    expect(buttons.length).toBe(1);
    expect(buttons[0].nativeElement.textContent).toContain('prescription.finishExecution.action');
  });

  it('should display the finish execution, cancel execution and transfer button when the current user is a professional and current user ssin is the same as task caregiver ssin and the performertask is in progress', () => {
    prescriptionDetailsSecondaryMockService.getCurrentUser.mockReturnValue({ data: mockPro });
    prescriptionDetailsSecondaryMockService.getPatient.mockReturnValue({ data: mockPro });

    mockPerformerTask.status = FhirR4TaskStatus.Inprogress;
    mockPerformerTask.careGiverSsin = mockPro.ssin;

    prescriptionDetailsSecondaryMockService.getPrescription.mockReturnValue({
      data: prescriptionResponse(null, null, [mockPerformerTask]),
    });
    prescriptionDetailsSecondaryMockService.getPerformerTask.mockReturnValue({ data: mockPerformerTask });

    const fixture = TestBed.createComponent(PrescriptionButtonGroupComponent);
    const component = fixture.componentInstance;
    component.currentPerformerTask = mockPerformerTask;
    fixture.detectChanges();

    const { debugElement } = fixture;
    const buttons = debugElement.queryAll(By.css('button'));
    expect(buttons.length).toBe(3);
    expect(buttons[0].nativeElement.textContent).toContain('prescription.finishExecution.action');
    expect(buttons[1].nativeElement.textContent).toContain('prescription.cancelExecution.action');
    expect(buttons[2].nativeElement.textContent).toContain('prescription.transfer');
  });
});
