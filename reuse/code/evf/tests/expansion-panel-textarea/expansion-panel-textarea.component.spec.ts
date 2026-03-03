import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpansionPanelTextareaComponent as Wrapper } from './expansion-panel-textarea.component';
import {
  EvfActiveValidationPipe,
  evfElementConfigFeature,
  FormTemplate,
  provideEvfCore,
} from '@smals-belgium-shared/vas-evaluation-form-ui-core';
import { ExpansionPanelTextareaComponent } from '@reuse/code/evf/components/expansion-panel-textarea/detail/expansion-panel-textarea.component';
import { By } from '@angular/platform-browser';
import { MarkdownModule } from 'ngx-markdown';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { EvfDynamicFormComponent } from '@smals-belgium-shared/vas-evaluation-form-ui-material/dynamic-form';

const formTemplate: FormTemplate = {
  elements: [
    {
      id: 'diagnostic-request',
      viewType: 'expansionPanelTextarea',
      dataType: {
        type: 'string',
      },
      labelTranslationId: 'diagnostic-request',
      validations: [
        {
          name: 'required',
        },
      ],
      tags: ['freeText'],
    },
  ],
  translations: {
    'diagnostic-request': {
      fr: 'diagnostic-request FR',
      nl: 'diagnostic-request NL',
    },
  },
};

const formTemplateWithoutValidation: FormTemplate = {
  elements: [
    {
      id: 'diagnostic-request',
      viewType: 'expansionPanelTextarea',
      dataType: {
        type: 'string',
      },
      labelTranslationId: 'diagnostic-request',
      tags: ['freeText'],
    },
  ],
  translations: {
    'diagnostic-request': {
      fr: 'diagnostic-request FR',
      nl: 'diagnostic-request NL',
    },
  },
};

describe('ExpansionPanelTextareaComponent', () => {
  let component: Wrapper;
  let fixture: ComponentFixture<Wrapper>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Wrapper, MarkdownModule.forRoot(), NoopAnimationsModule, EvfDynamicFormComponent],
      providers: [
        provideEvfCore(
          evfElementConfigFeature({
            name: 'expansionPanelTextarea',
            element: ExpansionPanelTextareaComponent,
          })
        ),
        EvfActiveValidationPipe,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Wrapper);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize isExpanded signal with false when not required', () => {
      component.demoTemplate = formTemplateWithoutValidation;
      fixture.detectChanges();

      const componentInstance = getComponentInstance();

      expect(componentInstance.isExpanded()).toBe(false);
    });
    it('should initialize isExpanded signal with true when required', () => {
      component.demoTemplate = formTemplate;
      fixture.detectChanges();

      const componentInstance = getComponentInstance();

      expect(componentInstance.isExpanded()).toBe(true);
    });
  });

  describe('ngAfterViewInit', () => {
    it('should call activeValidationPipe.transform with correct parameters', () => {
      component.demoTemplate = formTemplate;
      fixture.detectChanges();

      const componentInstance = getComponentInstance();
      const spyPipe = jest.spyOn(componentInstance._activeValidationPipe, 'transform');

      componentInstance.ngAfterViewInit();

      expect(spyPipe).toHaveBeenCalledWith(componentInstance.elementControl, 'required');
    });

    it('should open panel when elementControl has value', () => {
      component.demoTemplate = formTemplate;
      fixture.detectChanges();

      const componentInstance = getComponentInstance();
      componentInstance.elementControl.setValue('Some text content');

      const openSpy = jest.spyOn(componentInstance.matExpansionPanel, 'open');

      componentInstance.ngAfterViewInit();

      expect(openSpy).toHaveBeenCalled();
    });

    it('should open panel when required validation exists even with empty string value', () => {
      component.demoTemplate = formTemplate;
      fixture.detectChanges();

      const componentInstance = getComponentInstance();

      componentInstance.elementControl.setValue('');

      const openSpy = jest.spyOn(componentInstance.matExpansionPanel, 'open');

      componentInstance.ngAfterViewInit();

      expect(openSpy).toHaveBeenCalled();
    });

    it('should not open panel when elementControl.value is null and no required validation', () => {
      component.demoTemplate = formTemplateWithoutValidation;
      fixture.detectChanges();

      const componentInstance = getComponentInstance();

      componentInstance.elementControl.setValue(null);

      const openSpy = jest.spyOn(componentInstance.matExpansionPanel, 'open');

      componentInstance.ngAfterViewInit();

      expect(openSpy).not.toHaveBeenCalled();
    });

    it('should not open panel when elementControl.value is undefined and no required validation', () => {
      component.demoTemplate = formTemplateWithoutValidation;
      fixture.detectChanges();

      const componentInstance = getComponentInstance();

      componentInstance.elementControl.setValue(undefined);

      const openSpy = jest.spyOn(componentInstance.matExpansionPanel, 'open');

      componentInstance.ngAfterViewInit();

      expect(openSpy).not.toHaveBeenCalled();
    });

    it('should handle empty string value correctly and no required validation', () => {
      component.demoTemplate = formTemplateWithoutValidation;
      fixture.detectChanges();

      const componentInstance = getComponentInstance();

      componentInstance.elementControl.setValue('');

      const openSpy = jest.spyOn(componentInstance.matExpansionPanel, 'open');

      componentInstance.ngAfterViewInit();

      expect(openSpy).not.toHaveBeenCalled();
    });
  });

  function getComponentInstance() {
    const expansionPanelTextareaDebugElement = fixture.debugElement.query(
      By.directive(ExpansionPanelTextareaComponent)
    );
    return expansionPanelTextareaDebugElement.componentInstance;
  }
});
