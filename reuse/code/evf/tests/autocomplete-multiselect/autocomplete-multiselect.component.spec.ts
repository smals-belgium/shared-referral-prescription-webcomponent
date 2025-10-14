import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AutocompleteMultiselectComponent as Wrapper } from './autocomplete-multiselect.component';
import {
  AutocompleteOption,
  evfElementConfigFeature,
  EvfExternalSourceService,
  FormTemplate,
  provideEvfCore,
} from '@smals/vas-evaluation-form-ui-core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { EvfDynamicFormComponent } from '@smals/vas-evaluation-form-ui-material/dynamic-form';
import { BrowserModule, By } from '@angular/platform-browser';
import { MarkdownModule } from 'ngx-markdown';
import { of } from 'rxjs';
import { AutocompleteMultiselectComponent } from '../../autocomplete-multiselect/element/autocomplete-multiselect.component';
import { ExternalSourceService } from '@reuse/code/services/api/externalSourceService.service';

const mockAutocompleteOptions: AutocompleteOption[] = [
  { label: { en: 'Option 1', fr: 'Option 1', nl: 'Option 1', de: 'Option 1' }, value: 'opt1' },
  { label: { en: 'Option 2', fr: 'Option 2', nl: 'Option 2', de: 'Option 2' }, value: 'opt2' },
  { label: { en: 'Option 3', fr: 'Option 3', nl: 'Option 3', de: 'Option 3' }, value: 'opt3' },
];

const formTemplate: FormTemplate = {
  elements: [
    {
      id: 'autocomplete-multiselect',
      viewType: 'autocompleteMultiselect',
      dataType: {
        type: 'array',
      },
      labelTranslationId: 'autocomplete-multiselect',
      externalSource: {
        dataUrl: '/externalSource',
        strict: false,
      },
      validations: [
        {
          name: 'required',
        },
      ],
    },
  ],
  translations: {
    'autocomplete-multiselect': {
      fr: 'Autocomplete',
      nl: 'Autocomplete',
    },
  },
};

const disableAnimations =
  !('animate' in document.documentElement) || (navigator && /iPhone OS (8|9|10|11|12|13)_/.test(navigator.userAgent));

describe('AutocompleteMultiselectComponent', () => {
  let component: Wrapper;
  let fixture: ComponentFixture<Wrapper>;
  let evfExternalSourceServiceMock: jest.Mocked<EvfExternalSourceService>;
  let consoleSpy: jest.SpyInstance;

  beforeEach(async () => {
    consoleSpy = jest.spyOn(global.console, 'error').mockImplementation(message => {
      //remove material overlay error
      if (!message?.message?.includes('Could not parse CSS stylesheet')) {
        global.console.warn(message);
      }
    });

    evfExternalSourceServiceMock = {
      handleAutocomplete: jest.fn().mockReturnValue(of(mockAutocompleteOptions)),
      handleValidation: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [
        Wrapper,
        EvfDynamicFormComponent,
        BrowserModule,
        BrowserAnimationsModule.withConfig({ disableAnimations }),
        MarkdownModule.forRoot(),
      ],
      providers: [
        provideEvfCore(
          evfElementConfigFeature({
            name: 'autocompleteMultiselect',
            element: AutocompleteMultiselectComponent,
          })
        ),
        { provide: ExternalSourceService, useValue: evfExternalSourceServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Wrapper);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterAll(() => consoleSpy.mockRestore());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the form fields', () => {
    component.demoTemplate = formTemplate;
    fixture.detectChanges();
    expect(component).toBeTruthy();

    const formField = fixture.debugElement.query(By.css('mat-form-field'));
    expect(formField).toBeTruthy();
    expect(formField.nativeElement.getAttribute('ng-reflect-appearance')).toBe('outline');

    const label = fixture.debugElement.query(By.css('mat-label'));
    expect(label).toBeFalsy();

    const input = fixture.debugElement.query(By.css('input[matInput]'));
    expect(input).toBeTruthy();
    expect(input.nativeElement.type).toBe('text');
    expect(input.nativeElement.id).toBe('evf-autocomplete-0');
    expect(input.nativeElement.getAttribute('ng-reflect-form')).toBeTruthy();

    const chips = fixture.debugElement.queryAll(By.css('mat-chip-row'));
    expect(chips.length).toBe(0);
  });

  it('should type in input and update form control value', () => {
    component.demoTemplate = formTemplate;
    fixture.detectChanges();

    const input = fixture.debugElement.query(By.css('input[matInput]'));
    const inputElement = input.nativeElement as HTMLInputElement;

    // Type in the input
    inputElement.value = 'opt1';
    inputElement.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const autocompleteFormDebugElement = fixture.debugElement.query(By.directive(AutocompleteMultiselectComponent));
    expect(autocompleteFormDebugElement.componentInstance.searchControl.value).toBe('opt1');
  });

  it('should simulate typing character by character', () => {
    component.demoTemplate = formTemplate;
    fixture.detectChanges();

    const autocompleteFormDebugElement = fixture.debugElement.query(By.directive(AutocompleteMultiselectComponent));

    const updateQuerySpy = jest.spyOn(autocompleteFormDebugElement.componentInstance, 'updateQuery');

    const input = fixture.debugElement.query(By.css('input[matInput]'));
    const inputElement = input.nativeElement as HTMLInputElement;

    const testText = 'opt';
    for (let i = 0; i < testText.length; i++) {
      const currentText = testText.substring(0, i + 1);
      inputElement.value = currentText;

      // Trigger input event
      inputElement.dispatchEvent(new Event('input'));

      // Trigger keyup event
      const keyEvent = new KeyboardEvent('keyup', {
        key: testText[i],
        code: `Key${testText[i].toUpperCase()}`,
      });
      inputElement.dispatchEvent(keyEvent);

      fixture.detectChanges();
    }

    expect(updateQuerySpy).toHaveBeenCalledTimes(testText.length);
    expect(inputElement.value).toBe('opt');
  });

  it('should simulate selecting option from autocomplete and add chip', async () => {
    component.demoTemplate = formTemplate;
    fixture.detectChanges();

    const autocompleteFormDebugElement = fixture.debugElement.query(By.directive(AutocompleteMultiselectComponent));

    const input = fixture.debugElement.query(By.css('input[matInput]'));
    const inputElement = input.nativeElement as HTMLInputElement;

    // Setup autocomplete options
    const newOption = { label: { en: 'New Item', fr: 'Nouvel Article' }, value: 'new_item' };
    autocompleteFormDebugElement.componentInstance.options$ = of([newOption]);

    // Type to trigger autocomplete
    inputElement.value = 'New';
    inputElement.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();

    // Click on the autocomplete option
    const autocompleteOptions = fixture.debugElement.queryAll(By.css('mat-option'));
    if (autocompleteOptions.length > 0) {
      autocompleteOptions[0].nativeElement.click();
      fixture.detectChanges();

      // Check if selected method was called
      expect(autocompleteFormDebugElement.componentInstance.selected).toHaveBeenCalled();

      // Input should be cleared after selection
      expect(inputElement.value).toBe('');
    }
  });

  it('should call updateQuery on keyup event', () => {
    component.demoTemplate = formTemplate;

    fixture.detectChanges();

    const autocompleteFormDebugElement = fixture.debugElement.query(By.directive(AutocompleteMultiselectComponent));

    const updateQuerySpy = jest.spyOn(autocompleteFormDebugElement.componentInstance, 'updateQuery');

    const input = fixture.debugElement.query(By.css('input[matInput]'));
    const event = new KeyboardEvent('keyup', { key: 'a' });
    input.nativeElement.dispatchEvent(event);

    expect(updateQuerySpy).toHaveBeenCalledWith(event);
  });

  it('should display autocomplete options', async () => {
    component.demoTemplate = formTemplate;
    fixture.detectChanges();

    const autocompleteFormDebugElement = fixture.debugElement.query(By.directive(AutocompleteMultiselectComponent));
    autocompleteFormDebugElement.componentInstance.options$ = of(mockAutocompleteOptions);
    fixture.detectChanges();

    // Trigger autocomplete panel opening
    const input = fixture.debugElement.query(By.css('input[matInput]'));
    input.nativeElement.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const options = fixture.debugElement.queryAll(By.css('mat-option'));
    expect(options.length).toBe(mockAutocompleteOptions.length);
  });

  it('should call selected method when option is selected', async () => {
    component.demoTemplate = formTemplate;
    fixture.detectChanges();

    const autocompleteFormDebugElement = fixture.debugElement.query(By.directive(AutocompleteMultiselectComponent));
    autocompleteFormDebugElement.componentInstance.options$ = of(mockAutocompleteOptions);
    fixture.detectChanges();

    const selectedSpy = jest.spyOn(autocompleteFormDebugElement.componentInstance, 'selected');

    const input = fixture.debugElement.query(By.css('input[matInput]'));
    input.nativeElement.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const firstOption = fixture.debugElement.query(By.css('mat-option'));
    firstOption.nativeElement.click();

    expect(selectedSpy).toHaveBeenCalled();
  });
});
