import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssignProfessionalButtonComponent as Wrapper } from './assign-professional-button.component';
import { AssignProfessionalButtonComponent as ElementComponent } from '@reuse/code/evf/components/assign-professional-dialog-button/element/assign-professional-button.component';
import { FormControl } from '@angular/forms';
import { EvfDynamicFormComponent } from '@smals-belgium-shared/vas-evaluation-form-ui-material/dynamic-form';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MarkdownModule } from 'ngx-markdown';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import {
  evfElementConfigFeature,
  EvfTranslateService,
  provideEvfCore,
} from '@smals-belgium-shared/vas-evaluation-form-ui-core';
import { of } from 'rxjs';
import { TranslateModule, TranslatePipe } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { HealthcareProResource, ProviderType } from '@reuse/code/openapi';
import { Intent } from '@reuse/code/interfaces';

describe('AssignProfessionalButtonComponent', () => {
  let wrapperFixture: ComponentFixture<Wrapper>;
  let wrapperComponent: Wrapper;
  let component: ElementComponent;
  let matDialogMock: {
    open: jest.Mock;
  };

  const disableAnimations =
    !('animate' in document.documentElement) || (navigator && /iPhone OS (8|9|10|11|12|13)_/.test(navigator.userAgent));

  const setControl = (formControl: FormControl | Record<string, unknown>) => {
    Object.defineProperty(component, 'control', {
      configurable: true,
      get: () => formControl,
    });
  };

  beforeEach(async () => {
    matDialogMock = {
      open: jest.fn(),
    };
    await TestBed.configureTestingModule({
      imports: [
        Wrapper,
        ElementComponent,
        EvfDynamicFormComponent,
        BrowserModule,
        BrowserAnimationsModule.withConfig({ disableAnimations }),
        MarkdownModule.forRoot(),
        MatIconTestingModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        { provide: MatDialog, useValue: matDialogMock },
        provideEvfCore(
          evfElementConfigFeature({
            name: 'assignProfessionalButton',
            element: ElementComponent,
          })
        ),
        TranslatePipe,
        {
          provide: EvfTranslateService,
          useValue: {
            currentLang: 'en',
            currentLang$: of('en'),
            load: jest.fn().mockReturnValue(of(undefined)),
            get: jest.fn().mockImplementation((key: string) => key),
          },
        },
      ],
    }).compileComponents();

    wrapperFixture = TestBed.createComponent(Wrapper);
    wrapperComponent = wrapperFixture.componentInstance;
    wrapperFixture.detectChanges();

    component = TestBed.createComponent(ElementComponent).componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should open the dialog with assign mode, category as nursing, intent as proposal and providerType as professional', () => {
    matDialogMock.open.mockReturnValue({
      beforeClosed: () => of(undefined),
    });

    component.openAssignProfessionalDialog();

    expect(matDialogMock.open).toHaveBeenCalledTimes(1);
    expect(matDialogMock.open).toHaveBeenCalledWith(expect.any(Function), {
      data: {
        mode: 'assign',
        category: 'nursing',
        intent: Intent.PROPOSAL,
        providerTypeFilter: [ProviderType.Professional],
      },
      maxHeight: '90vh',
      maxWidth: '90vw',
      panelClass: ['mh-dialog-container', 'mh-assign-dialog'],
      width: '900px',
    });
  });

  it('should store selected professional and set control value when dialog returns a valid professional', () => {
    const controlMock = {
      setValue: jest.fn(),
    };
    setControl(controlMock);

    const professional: HealthcareProResource = {
      healthcarePerson: {
        ssin: '12345678901',
        firstName: 'Jane',
        lastName: 'Doe',
      },
      healthcareQualification: {
        id: {
          profession: 'PHYSICIAN',
          code: '001',
        },
      },
      nihii11: '12345678901',
    };

    matDialogMock.open.mockReturnValue({
      beforeClosed: () => of(professional),
    });

    component.openAssignProfessionalDialog();

    expect(component.selectedProfessional()).toEqual(professional);
    expect(controlMock.setValue).toHaveBeenCalled();
    expect(controlMock.setValue).toHaveBeenCalledWith({
      ssin: '12345678901',
      role: 'PHYSICIAN',
    });
  });
  it('should clear selected professional and control value when removing the selected professional', () => {
    const controlMock = {
      setValue: jest.fn(),
    };
    setControl(controlMock);

    const professional: HealthcareProResource = {
      healthcarePerson: {
        ssin: '12345678901',
        firstName: 'Jane',
        lastName: 'Doe',
      },
      healthcareQualification: {
        id: {
          profession: 'PHYSICIAN',
          code: '001',
        },
      },
      nihii11: '12345678901',
    };

    component.selectedProfessional.set(professional);

    component.removeSelectedProfessional();

    expect(component.selectedProfessional()).toBeUndefined();
    expect(controlMock.setValue).toHaveBeenCalledWith(undefined);
  });
});
