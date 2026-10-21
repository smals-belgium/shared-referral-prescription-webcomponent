import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { FormControl } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { MarkdownModule } from 'ngx-markdown';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import {
  AutocompleteOption,
  EvfTranslateService,
  evfElementConfigFeature,
  FormTemplate,
  provideEvfCore,
} from '@smals-belgium-shared/vas-evaluation-form-ui-core';
import { ExternalSourceService } from '@reuse/code/services/api/externalSourceService.service';
import { EvfDynamicFormComponent } from '@smals-belgium-shared/vas-evaluation-form-ui-material/dynamic-form';
import { AutoCheckboxListComponent as ElementComponent } from '@reuse/code/evf/components/auto-checkbox-list/element/auto-checkbox-list.component';
import { AutoCheckboxListComponent as Wrapper } from '@reuse/code/evf/tests/auto-checkbox-list/auto-checkbox-list.component';

const optionA: AutocompleteOption = {
  label: { en: 'Option A', fr: 'Option A', nl: 'Option A', de: 'Option A' },
  value: 'a',
};

const optionB: AutocompleteOption = {
  label: { en: 'Option B', fr: 'Option B', nl: 'Option B', de: 'Option B' },
  value: 'b',
};

describe('AutoCheckboxListComponent', () => {
  let wrapperFixture: ComponentFixture<Wrapper>;
  let wrapperComponent: Wrapper;
  let component: ElementComponent;
  let externalSourceServiceMock: { handleSelectOptions: jest.Mock };
  let liveAnnouncerMock: { announce: jest.Mock<Promise<void>, [string]> };

  const formTemplate: FormTemplate = {
    elements: [
      {
        id: 'auto-checkbox-list',
        viewType: 'autoCheckboxList',
        dataType: {
          type: 'array',
        },
        labelTranslationId: 'auto-checkbox-list-label',
        externalSource: {
          dataUrl: '/source',
          strict: false,
        },
      },
    ],
    translations: {
      'auto-checkbox-list-label': {
        fr: 'Auto checkbox list',
        nl: 'Auto checkbox list',
      },
    },
  };

  const disableAnimations =
    !('animate' in document.documentElement) || (navigator && /iPhone OS (8|9|10|11|12|13)_/.test(navigator.userAgent));

  const setElement = (element: Record<string, unknown>) => {
    Object.defineProperty(component, 'element', {
      configurable: true,
      get: () => element,
    });
  };

  const setControl = (control: FormControl | Record<string, unknown>) => {
    Object.defineProperty(component, 'control', {
      configurable: true,
      get: () => control,
    });
  };

  const setElementControl = (elementControl: Record<string, unknown>) => {
    Object.defineProperty(component, 'elementControl', {
      configurable: true,
      get: () => elementControl,
    });
  };

  const setEvents = (emit: jest.Mock) => {
    Object.defineProperty(component, 'events', {
      configurable: true,
      get: () => ({ emit }),
    });
  };

  beforeEach(async () => {
    externalSourceServiceMock = {
      handleSelectOptions: jest.fn(),
    };
    liveAnnouncerMock = {
      announce: jest.fn().mockResolvedValue(undefined),
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
      ],
      providers: [
        provideEvfCore(
          evfElementConfigFeature({
            name: 'autoCheckboxList',
            element: ElementComponent,
          })
        ),
        { provide: ExternalSourceService, useValue: externalSourceServiceMock },
        { provide: LiveAnnouncer, useValue: liveAnnouncerMock },
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

  it('should create wrapper component', () => {
    expect(wrapperComponent).toBeTruthy();
  });

  it('should accept a demo template input', () => {
    wrapperFixture.componentRef.setInput('demoTemplate', formTemplate);

    expect(wrapperComponent.demoTemplate).toEqual(formTemplate);
  });

  it('loads checkbox options from external source on init', () => {
    setElement({ externalSource: { dataUrl: '/source' } });
    setControl(new FormControl([]));
    externalSourceServiceMock.handleSelectOptions.mockReturnValue(of([optionA, optionB]));

    component.setOptionsStream();

    expect(externalSourceServiceMock.handleSelectOptions).toHaveBeenCalledWith({ dataUrl: '/source' });
    expect(component.rawOptions()).toEqual([optionA, optionB]);
  });

  it('maps external source errors to an AutocompleteError object', () => {
    setElement({ externalSource: { dataUrl: '/source' } });
    setControl(new FormControl([]));
    externalSourceServiceMock.handleSelectOptions.mockReturnValue(throwError(() => new Error('OPTIONS_FAILED')));

    component.setOptionsStream();

    expect(component.rawOptions()).toEqual({ translate: 'OPTIONS_FAILED' });
  });

  it('auto-selects and announces when exactly one option is returned', () => {
    const controlMock = {
      setValue: jest.fn(),
      markAsDirty: jest.fn(),
    };

    setControl(controlMock);
    (component as any).autoSelectOption([optionA]);

    expect(controlMock.setValue).toHaveBeenCalledWith([optionA]);
    expect(controlMock.markAsDirty).toHaveBeenCalled();
    expect(liveAnnouncerMock.announce).toHaveBeenCalledWith('added Option A');
  });

  it('adds checked option sorted by value and emits click event', () => {
    const setValue = jest.fn();
    const markAsTouched = jest.fn();
    const emit = jest.fn();

    setElementControl({
      value: [optionB],
      setValue,
      markAsTouched,
    });
    setEvents(emit);

    component.checkChanged({ checked: true } as MatCheckboxChange, optionA);

    expect(setValue).toHaveBeenCalledWith([optionA, optionB]);
    expect(markAsTouched).toHaveBeenCalled();
    expect(emit).toHaveBeenCalledWith({ type: 'CLICK_OPTION', data: { value: 'a' } });
  });

  it('removes unchecked option and keeps remaining selections', () => {
    const setValue = jest.fn();

    setElementControl({
      value: [optionA, optionB],
      setValue,
      markAsTouched: jest.fn(),
    });
    setEvents(jest.fn());

    component.checkChanged({ checked: false } as MatCheckboxChange, optionA);

    expect(setValue).toHaveBeenCalledWith([optionB]);
  });

  it('returns true only for selected option values', () => {
    setControl(new FormControl([optionA]));

    expect(component.isChecked('a')).toBe(true);
    expect(component.isChecked('b')).toBe(false);
  });
});
