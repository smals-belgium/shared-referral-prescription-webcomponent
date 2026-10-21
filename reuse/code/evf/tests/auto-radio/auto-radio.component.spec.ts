import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { of, throwError } from 'rxjs';
import { FormControl } from '@angular/forms';
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
import { AutoRadioComponent as ElementComponent } from '@reuse/code/evf/components/auto-radio/element/auto-radio.component';
import { AutoRadioComponent as Wrapper } from '@reuse/code/evf/tests/auto-radio/auto-radio.component';

const options: AutocompleteOption[] = [
  {
    label: { en: 'Option A', fr: 'Option A', nl: 'Option A', de: 'Option A' },
    value: 'a',
  },
  {
    label: { en: 'Option B', fr: 'Option B', nl: 'Option B', de: 'Option B' },
    value: 'b',
  },
];

describe('AutoRadioComponent', () => {
  let wrapperFixture: ComponentFixture<Wrapper>;
  let wrapperComponent: Wrapper;
  let component: ElementComponent;
  let externalSourceServiceMock: { handleSelectOptions: jest.Mock };
  let liveAnnouncerMock: { announce: jest.Mock<Promise<void>, [string]> };

  const formTemplate: FormTemplate = {
    elements: [
      {
        id: 'auto-radio',
        viewType: 'autoRadio',
        dataType: {
          type: 'string',
        },
        labelTranslationId: 'auto-radio-label',
        externalSource: {
          dataUrl: '/source',
          strict: false,
        },
      },
    ],
    translations: {
      'auto-radio-label': {
        fr: 'Auto radio',
        nl: 'Auto radio',
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
            name: 'autoRadio',
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
            get: jest.fn().mockImplementation((key: string) => of(key)),
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

  it('loads options from external source on init', () => {
    setElement({ externalSource: { dataUrl: '/source' } });
    setControl(new FormControl(null));
    externalSourceServiceMock.handleSelectOptions.mockReturnValue(of(options));

    component.setOptionsStream();

    expect(externalSourceServiceMock.handleSelectOptions).toHaveBeenCalledWith({ dataUrl: '/source' });
    expect(component.rawOptions()).toEqual(options);
  });

  it('maps external source errors to an AutocompleteError object', () => {
    setElement({ externalSource: { dataUrl: '/source' } });
    setControl(new FormControl(null));
    externalSourceServiceMock.handleSelectOptions.mockReturnValue(throwError(() => new Error('FETCH_FAILED')));

    component.setOptionsStream();

    expect(component.rawOptions()).toEqual({ translate: 'FETCH_FAILED' });
  });

  it('auto-selects and announces when exactly one option is returned', () => {
    const controlMock = {
      setValue: jest.fn(),
      markAsDirty: jest.fn(),
    };

    setControl(controlMock);
    (component as any).autoSelectOption([options[0]]);

    expect(component.selectedItem()).toEqual(options[0]);
    expect(controlMock.setValue).toHaveBeenCalledWith(options[0]);
    expect(controlMock.markAsDirty).toHaveBeenCalled();
    expect(liveAnnouncerMock.announce).toHaveBeenCalledWith('added Option A');
  });

  it('unselects an already selected radio option when clicked again', () => {
    jest.useFakeTimers();
    const controlMock = {
      value: 'a',
      markAsTouched: jest.fn(),
      setValue: jest.fn(),
    };

    Object.defineProperty(component, 'disabled', {
      configurable: true,
      get: () => false,
    });
    setControl(controlMock);

    component.clickRadio(options[0]);
    jest.runAllTimers();

    expect(controlMock.markAsTouched).toHaveBeenCalled();
    expect(controlMock.setValue).toHaveBeenCalledWith(null);
    jest.useRealTimers();
  });

  it('emits CLICK_OPTION with selected value when radio changes', () => {
    const emit = jest.fn();
    setEvents(emit);

    component.userChangeOption({ value: 'b' } as any);

    expect(emit).toHaveBeenCalledWith({ type: 'CLICK_OPTION', data: { value: 'b' } });
  });
});
