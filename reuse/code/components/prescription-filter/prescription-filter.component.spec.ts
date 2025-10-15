import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrescriptionFilterComponent } from './prescription-filter.component';
import { MultiselectOption } from '../../components/multiselect/multiselect.component';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { By } from '@angular/platform-browser';
import { RequestStatus } from '@reuse/code/openapi';

describe('PrescriptionFilterComponent', () => {
  let component: PrescriptionFilterComponent;
  let fixture: ComponentFixture<PrescriptionFilterComponent>;

  const mockStatusOptions: MultiselectOption[] = [
    { name: RequestStatus.Open, value: RequestStatus.Open },
    { name: RequestStatus.Expired, value: RequestStatus.Expired },
  ];

  const mockTemplateOptions: MultiselectOption[] = [
    { name: 'Type 1', value: 'TYPE1' },
    { name: 'Type 2', value: 'TYPE2' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        PrescriptionFilterComponent,
        ReactiveFormsModule,
        MatButtonModule,
        NoopAnimationsModule,
        TranslateModule.forRoot(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PrescriptionFilterComponent);
    component = fixture.componentInstance;

    // Set up component with initial data
    component.statusOptions = mockStatusOptions;
    component.templateOptions = mockTemplateOptions;
    component.initialFilter = {
      status: undefined,
      prescriptionType: undefined,
    };
  });

  it('should create the component with properly initialized form', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(component.formGroup.get('status')?.value).toEqual(null);
    expect(component.formGroup.get('prescriptionType')?.value).toEqual(null);
  });

  it('should create the component with initialValue', () => {
    component.initialFilter = {
      status: [RequestStatus.Open],
      prescriptionType: ['TYPE1'],
    };
    fixture.detectChanges();
    expect(component.formGroup.get('status')?.value).toEqual([
      {
        name: `prescription.statuses.${RequestStatus.Open}`,
        value: RequestStatus.Open,
      },
    ]);
    expect(component.formGroup.get('prescriptionType')?.value).toEqual([
      {
        name: 'Type 1',
        value: 'TYPE1',
      },
    ]);
  });

  it('should conditionally render multiselect components', () => {
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('[data-form="status"]'))).toBeTruthy();
    expect(fixture.debugElement.query(By.css('[data-form="prescriptionType"]'))).toBeTruthy();

    component.statusOptions = undefined;
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('[data-form="status"]'))).toBeFalsy();
    expect(fixture.debugElement.query(By.css('[data-form="prescriptionType"]'))).toBeTruthy();
  });

  it('should emit filter event with form values when submitted', () => {
    fixture.detectChanges();
    jest.spyOn(component.filterChange, 'emit');

    component.formGroup.setValue({
      status: [
        {
          name: `prescription.statuses.${RequestStatus.Open}`,
          value: RequestStatus.Open,
        },
        {
          name: `prescription.statuses.${RequestStatus.Expired}`,
          value: RequestStatus.Expired,
        },
      ],
      prescriptionType: [
        {
          name: 'Type 2',
          value: 'TYPE2',
        },
      ],
    });

    const submitButton = fixture.debugElement.query(By.css('button[type="submit"]'));
    submitButton.nativeElement.click();

    expect(component.filterChange.emit).toHaveBeenCalledWith({
      status: [RequestStatus.Open, RequestStatus.Expired],
      prescriptionType: ['TYPE2'],
    });
  });

  it('should not emit filter event if form is invalid', () => {
    fixture.detectChanges();
    jest.spyOn(component.filterChange, 'emit');

    component.formGroup.setErrors({ invalid: true });

    const submitButton = fixture.debugElement.query(By.css('button[type="submit"]'));
    submitButton.nativeElement.click();

    expect(component.filterChange.emit).not.toHaveBeenCalled();
  });

  it('should reset form to initial values', () => {
    fixture.detectChanges();
    jest.spyOn(component.filterChange, 'emit');
    component.formGroup.setValue({
      status: [RequestStatus.Expired],
      prescriptionType: ['TYPE2'],
    });
    component.formGroup.markAsDirty();

    component.resetForm();

    expect(component.formGroup.get('status')?.value).toEqual(null);
    expect(component.formGroup.get('prescriptionType')?.value).toEqual(null);
    expect(component.formGroup.pristine).toBe(true);

    expect(component.filterChange.emit).toHaveBeenCalledWith({
      status: null,
      prescriptionType: null,
    });
  });
});
