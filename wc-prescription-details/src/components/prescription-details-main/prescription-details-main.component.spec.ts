import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { PrescriptionDetailsMainComponent } from './prescription-details-main.component';
import { of } from 'rxjs';
import { By } from '@angular/platform-browser';
import { HttpCacheService } from '@reuse/code/services/cache/http-cache.service';
import {
  FakeLoader,
  mockPerson,
  prescriptionDetailsSecondaryMockService,
  prescriptionResponse,
} from '../../../test.utils';
import { PrescriptionDetailsSecondaryService } from '../prescription-details-secondary/prescription-details-secondary.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { DateAdapter, MatNativeDateModule, NativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { PrescriptionDetailsBeneficiaryComponent } from './prescription-details-beneficiary/prescription-details-beneficiary.component';

describe('PrescriptionDetailsMainComponent', () => {
  let component: PrescriptionDetailsMainComponent;
  let fixture: ComponentFixture<PrescriptionDetailsMainComponent>;
  let cacheHttpService: HttpCacheService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        PrescriptionDetailsMainComponent,
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: FakeLoader },
        }),
        PrescriptionDetailsBeneficiaryComponent,
        MatDatepickerModule,
        MatNativeDateModule,
        MatDialogModule,
        NoopAnimationsModule,
      ],
      providers: [
        MatDialog,
        { provide: DateAdapter, useClass: NativeDateAdapter },
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PrescriptionDetailsSecondaryService, useValue: prescriptionDetailsSecondaryMockService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PrescriptionDetailsMainComponent);
    component = fixture.componentInstance;

    cacheHttpService = TestBed.inject(HttpCacheService);
  });

  it('should show a prescription based on shortCode and SSIN', () => {
    jest.spyOn(cacheHttpService, 'loadFromCache').mockReturnValue(of(null));
    const mockResponse = prescriptionResponse();
    (component as any).prescription = mockResponse;
    (component as any).patient = mockPerson;

    fixture.detectChanges();

    expect(component.prescription).toEqual(mockResponse);

    const { debugElement } = fixture;
    const ssin = debugElement.query(By.css('.ssin')).nativeElement;
    expect(ssin.textContent).toContain('10.00.00-000.03');

    const divWithClassId = debugElement.query(By.css('.prescription_shortcode')).nativeElement;
    expect(divWithClassId.textContent).toContain(mockResponse.shortCode);
  });
});
