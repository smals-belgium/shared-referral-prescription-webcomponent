import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';

import { PrescriptionDetailsSecondaryComponent } from './prescription-details-secondary.component';
import { PrescriptionDetailsProfessionalListComponent } from '../professional-list/prescription-details-professional-list.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { prescriptionDetailsSecondaryMockService } from '../../../../../test.utils';
import { PrescriptionDetailsSecondaryService } from '../../services/prescription-details-secondary.service';

describe('PrescriptionDetailsSecondaryComponent', () => {
  let component: PrescriptionDetailsSecondaryComponent;
  let fixture: ComponentFixture<PrescriptionDetailsSecondaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrescriptionDetailsSecondaryComponent, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PrescriptionDetailsSecondaryService, useValue: prescriptionDetailsSecondaryMockService },
      ],
    })
      .overrideComponent(PrescriptionDetailsSecondaryComponent, {
        remove: {
          imports: [PrescriptionDetailsProfessionalListComponent],
        },
        add: { schemas: [CUSTOM_ELEMENTS_SCHEMA] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(PrescriptionDetailsSecondaryComponent);
    component = fixture.componentInstance;
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it('should render lists when prescription has performerTasks or organizationTasks', () => {
    (component as any).prescriptionServiceData = {
      performerTasks: { 'care-giver-ssin': [{ careGiverSsin: 'care-giver-ssin' }] },
      organizationTasks: [{ organizationNihii: 'organization-nihii' }],
    } as any;

    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('[data-cy="prescription-assign-to-label"]'))).toBeTruthy();
    expect(fixture.debugElement.query(By.css('[data-cy="prescription-assign-to-list"]'))).toBeTruthy();
    expect(fixture.debugElement.query(By.css('app-prescription-details-professional-list'))).toBeTruthy();
  });

  it('should not render lists when prescription has no tasks', () => {
    (component as any).prescriptionServiceData = {
      performerTasks: {},
      organizationTasks: [],
    } as any;

    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('[data-cy="prescription-assign-to-label"]'))).toBeTruthy();
    expect(fixture.debugElement.query(By.css('[data-cy="prescription-assign-to-list"]'))).toBeNull();
  });
});
