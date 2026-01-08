import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrescriptionDetailsBeneficiaryComponent } from './prescription-details-beneficiary.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Gender, PersonResource, ReadRequestResource } from '@reuse/code/openapi';

describe('PrescriptionDetailsBeneficiaryComponent', () => {
  let component: PrescriptionDetailsBeneficiaryComponent;
  let fixture: ComponentFixture<PrescriptionDetailsBeneficiaryComponent>;

  let translate: TranslateService;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        PrescriptionDetailsBeneficiaryComponent,
        TranslateModule.forRoot(),
      ]
    })
    .compileComponents();

    translate = TestBed.inject(TranslateService);
    translate.setDefaultLang('nl-BE');
    translate.use('nl-BE');

    fixture = TestBed.createComponent(PrescriptionDetailsBeneficiaryComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render patient and prescription info', () => {
    const mockPatient: PersonResource = {
      firstName: 'Alice',
      lastName: 'Smith',
      gender: Gender.F,
      ssin: '92010112345',
    } as PersonResource;

    const mockPrescription: ReadRequestResource = {
      shortCode: 'RX123',
    } as ReadRequestResource;

    component.patient = mockPatient;
    component.prescription = mockPrescription;
    fixture.detectChanges();

    // Verify rendered text
    expect(element.textContent).toContain('prescription.beneficiary');
    expect(element.textContent).toContain('Alice');
    expect(element.textContent).toContain('Smith');
    expect(element.textContent).toContain('common.gendersFull.F');
    expect(element.textContent).toContain('92.01.01-123.45');
    expect(element.textContent).toContain('RX123');
  });

  it('should handle missing patient and prescription gracefully', () => {
    component.patient = undefined;
    component.prescription = undefined;
    fixture.detectChanges();

    // Still renders the static label
    expect(element.textContent).toContain('prescription.beneficiary');
  });
});
