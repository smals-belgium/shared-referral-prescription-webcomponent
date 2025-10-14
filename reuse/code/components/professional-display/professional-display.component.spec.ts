import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfessionalDisplayComponent } from './professional-display.component';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Discipline, Role } from '@reuse/code/openapi';

describe('ProfessionalDisplayComponent', () => {
  let component: ProfessionalDisplayComponent;
  let fixture: ComponentFixture<ProfessionalDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ProfessionalDisplayComponent,
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: TranslateFakeLoader },
        }),
        MatIconModule,
        MatTooltipModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfessionalDisplayComponent);
    component = fixture.componentInstance;
  });

  it('should display currentUser name if professional has no lastName and ssin matches', () => {
    component.professional = {
      healthcareQualification: {} as any,
      healthcareStatus: {} as any,
      address: {} as any,
      licenseToPractice: true,
      type: 'Professional',
      healthcareVisaList: [
        {
          active: false,
          endDate: '',
        },
      ],
      subscriptionEndDate: '',
      id: {
        profession: 'NURSE',
        qualificationCode: '789',
        ssin: '123',
      },
      healthcarePerson: {} as any,
    };
    component.currentUser = {
      discipline: Discipline.Nurse,
      nihii11: '',
      professional: true,
      role: Role.Caregiver,
      ssin: '123',
      firstName: 'Alice',
      lastName: 'Dupont',
    };

    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Alice Dupont');
  });

  it('should show "not found" and icon if professional has no lastName and ssin does not match', () => {
    component.professional = {
      healthcareQualification: {} as any,
      healthcareStatus: {} as any,
      address: {} as any,
      licenseToPractice: true,
      type: 'Professional',
      healthcareVisaList: [
        {
          active: false,
          endDate: '',
        },
      ],
      subscriptionEndDate: '',
      id: {
        profession: 'NURSE',
        qualificationCode: '789',
        ssin: '123',
      },
      healthcarePerson: {} as any,
    };
    component.currentUser = {
      discipline: Discipline.Nurse,
      nihii11: '',
      professional: true,
      role: Role.Caregiver,
      ssin: '456',
      firstName: 'Alice',
      lastName: 'Dupont',
    };

    fixture.detectChanges();

    const nativeEl = fixture.nativeElement;
    expect(nativeEl.textContent).toContain('common.professional.notFound');
    expect(nativeEl.querySelector('mat-icon')?.textContent).toContain('error');
  });

  it('should display professional firstName and lastName if available', () => {
    component.professional = {
      healthcareQualification: {} as any,
      healthcareStatus: {} as any,
      address: {} as any,
      licenseToPractice: true,
      type: 'Professional',
      healthcareVisaList: [
        {
          active: false,
          endDate: '',
        },
      ],
      subscriptionEndDate: '',
      id: {
        profession: 'NURSE',
        qualificationCode: '123',
        ssin: '789',
      },
      healthcarePerson: {
        firstName: 'John',
        lastName: 'Doe',
      },
    };
    component.currentUser = {
      discipline: Discipline.Nurse,
      nihii11: '',
      professional: true,
      role: Role.Caregiver,
      ssin: '123',
      firstName: 'Alice',
      lastName: 'Dupont',
    };

    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('John Doe');
  });
});
