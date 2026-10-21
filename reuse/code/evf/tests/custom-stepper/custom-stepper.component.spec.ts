import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CustomStepperComponent as Wrapper } from './custom-stepper.component';
import {
  evfElementConfigFeature,
  FormTemplate,
  provideEvfCore,
} from '@smals-belgium-shared/vas-evaluation-form-ui-core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { EvfDynamicFormComponent } from '@smals-belgium-shared/vas-evaluation-form-ui-material/dynamic-form';
import { BrowserModule, By } from '@angular/platform-browser';
import { MarkdownModule } from 'ngx-markdown';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { CustomStepperComponent } from '@reuse/code/evf/components/custom-stepper/element/custom-stepper.component';
import { withInputTextElement } from '@smals-belgium-shared/vas-evaluation-form-ui-material/elements/input-text';

const formTemplate: FormTemplate = {
  elements: [
    {
      id: 'custom-stepper',
      viewType: 'customStepper',
      elements: [
        {
          id: 'step0',
          viewType: 'step',
          elements: [
            {
              id: 'question0',
              dataType: { type: 'string' },
              viewType: 'inputText',
            },
          ],
        },
        {
          id: 'step1',
          viewType: 'step',
          elements: [
            {
              id: 'question1',
              viewType: 'inputText',
              dataType: { type: 'string' },
              validations: [
                {
                  name: 'required',
                },
              ],
            },
          ],
        },
        {
          id: 'step2',
          viewType: 'step',
          elements: [
            {
              id: 'question2',
              viewType: 'inputText',
              dataType: { type: 'string' },
              elements: [
                {
                  id: 'question2-0',
                  dataType: { type: 'string' },
                  viewType: 'inputText',
                  validations: [
                    {
                      name: 'required',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  translations: {},
};

const nestedStepperTemplate: FormTemplate = {
  elements: [
    {
      id: 'parent-stepper',
      viewType: 'customStepper',
      elements: [
        {
          id: 'parent-step-1',
          viewType: 'step',
          elements: [
            {
              id: 'child-stepper',
              viewType: 'customStepper',
              custom: {
                stepperType: 'single-page',
                showParentNextOnlyOnChildLastStep: true,
              },
              elements: [
                {
                  id: 'child-step-1',
                  viewType: 'step',
                  elements: [
                    {
                      id: 'child-question-1',
                      dataType: { type: 'string' },
                      viewType: 'inputText',
                    },
                  ],
                },
                {
                  id: 'child-step-2',
                  viewType: 'step',
                  elements: [
                    {
                      id: 'child-question-2',
                      dataType: { type: 'string' },
                      viewType: 'inputText',
                      validations: [
                        {
                          name: 'required',
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          id: 'parent-step-2',
          viewType: 'step',
          elements: [
            {
              id: 'parent-question-1',
              dataType: { type: 'string' },
              viewType: 'inputText',
            },
          ],
        },
      ],
    },
  ],
  translations: {},
};

const disableAnimations =
  !('animate' in document.documentElement) || (navigator && /iPhone OS (8|9|10|11|12|13)_/.test(navigator.userAgent));

describe('CustomStepperComponent', () => {
  let component: Wrapper;
  let fixture: ComponentFixture<Wrapper>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        Wrapper,
        EvfDynamicFormComponent,
        BrowserModule,
        BrowserAnimationsModule.withConfig({ disableAnimations }),
        MarkdownModule.forRoot(),
        MatIconTestingModule,
      ],
      providers: [
        provideEvfCore(
          evfElementConfigFeature({
            name: 'customStepper',
            element: CustomStepperComponent,
          }),
          withInputTextElement()
        ),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Wrapper);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should create the fields', () => {
    fixture.componentRef.setInput('demoTemplate', formTemplate);
    fixture.detectChanges();

    const customStepper = fixture.debugElement.query(By.directive(CustomStepperComponent));
    const customStepperComponent = customStepper.componentInstance;
    const elementGroup = customStepperComponent.elementControl.elementGroup;

    expect(customStepperComponent.elementControl.elementGroup.get('question0')).toBeTruthy();
    expect(customStepperComponent.elementControl.elementGroup.get('question1')).toBeTruthy();
    expect(customStepperComponent.elementControl.elementGroup.get('question2')).toBeTruthy();
    expect(customStepperComponent.elementControl.elementGroup.get('question2-0')).toBeTruthy();
    expect(elementGroup.childElementControls).toHaveLength(1);
    expect(elementGroup.childElementControls[0].childElementControls).toHaveLength(3);
    expect(elementGroup.childElementControls[0].childElementControls[0].childElementControls).toHaveLength(1);
    expect(elementGroup.childElementControls[0].childElementControls[1].childElementControls).toHaveLength(1);
    expect(elementGroup.childElementControls[0].childElementControls[2].childElementControls).toHaveLength(1);
  });

  it('should navigate through the steps', () => {
    jest.spyOn(window, 'scrollTo').mockImplementation(() => {});
    fixture.componentRef.setInput('demoTemplate', formTemplate);
    fixture.detectChanges();

    const customStepper = fixture.debugElement.query(By.directive(CustomStepperComponent));
    const customStepperComponent = customStepper.componentInstance;
    const elementGroup = customStepperComponent.elementControl.elementGroup;

    const step1 = elementGroup.childElementControls[0].childElementControls[0];
    const step2 = elementGroup.childElementControls[0].childElementControls[1];
    const step3 = elementGroup.childElementControls[0].childElementControls[2];

    expect(customStepperComponent.currentStep).toEqual([0]);

    customStepperComponent.nextStep(step1.element.uniqueId);

    expect(customStepperComponent.currentStep).toEqual([1]);

    customStepperComponent.nextStep(step2.element.uniqueId); // Fails because of required field
    expect(step2.elementTreeValid).toBeFalsy();
    expect(customStepperComponent.currentStep).toEqual([1]);
    elementGroup.get('question1').setValue('value');

    customStepperComponent.nextStep(step2.element.uniqueId);

    expect(step2.elementTreeValid).toBeTruthy();
    expect(customStepperComponent.currentStep).toEqual([2]);

    customStepperComponent.nextStep(step3.element.uniqueId); // Fails because of required field
    expect(step3.elementTreeValid).toBeFalsy();
    expect(customStepperComponent.currentStep).toEqual([2]);
    elementGroup.get('question2-0').setValue('value');

    customStepperComponent.nextStep(step3.element.uniqueId);

    expect(step3.elementTreeValid).toBeTruthy();
    expect(customStepperComponent.currentStep).toEqual([3]); // Summary

    customStepperComponent.previousStep();

    expect(customStepperComponent.currentStep).toEqual([2]);

    customStepperComponent.previousStep();

    expect(customStepperComponent.currentStep).toEqual([1]);

    customStepperComponent.previousStep();

    expect(customStepperComponent.currentStep).toEqual([0]);

    customStepperComponent.previousStep();
    expect(customStepperComponent.currentStep).toEqual([0]);
  });

  it('should clear the configured target control when checkIfActionNeeded is triggered', () => {
    fixture.componentRef.setInput('demoTemplate', formTemplate);
    fixture.detectChanges();

    const customStepper = fixture.debugElement.query(By.directive(CustomStepperComponent));
    const customStepperComponent = customStepper.componentInstance;
    const elementGroup = customStepperComponent.elementControl.elementGroup;

    const step1 = elementGroup.childElementControls[0].childElementControls[0];
    const targetControl = elementGroup.get('question1');

    step1.element.custom = {
      triggerTargetIdOnClickNext: 'question1',
    };

    const setValueSpy = jest.spyOn(targetControl, 'setValue');

    customStepperComponent['checkIfActionNeeded'](step1);

    expect(setValueSpy).toHaveBeenCalledWith([]);
  });

  it('should scroll to the element with an error', () => {
    jest.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const mockErrorElement = {
      getBoundingClientRect: jest.fn().mockReturnValue({
        top: -500,
      }),
    };

    fixture.componentRef.setInput('demoTemplate', formTemplate);
    fixture.detectChanges();

    const customStepper = fixture.debugElement.query(By.directive(CustomStepperComponent));
    const customStepperComponent = customStepper.componentInstance;
    const elementGroup = customStepperComponent.elementControl.elementGroup;

    const step1 = elementGroup.childElementControls[0].childElementControls[0];
    const step2 = elementGroup.childElementControls[0].childElementControls[1];

    jest.spyOn(customStepperComponent.events, 'emit');
    jest.useFakeTimers();
    const htmlElement = {
      querySelector: jest.fn().mockReturnValue(mockErrorElement),
    } as any;

    customStepperComponent.nextStep(step1.element.uniqueId, htmlElement);

    jest.advanceTimersByTime(1);
    expect(customStepperComponent.events.emit).not.toHaveBeenCalledWith({
      type: 'SCROLL_TO_INVALID',
      data: { htmlElement },
    });

    customStepperComponent.nextStep(step2.element.uniqueId, htmlElement);
    jest.advanceTimersByTime(1);

    expect(customStepperComponent.events.emit).toHaveBeenCalledWith({
      type: 'SCROLL_TO_INVALID',
      data: { htmlElement },
    });
    jest.clearAllTimers();
  });

  it('should show parent next button only when nested stepper is at last step (single-page mode)', () => {
    fixture.componentRef.setInput('demoTemplate', nestedStepperTemplate);
    fixture.detectChanges();

    const parentStepper = fixture.debugElement.query(By.directive(CustomStepperComponent));
    const parentStepperComponent = parentStepper.componentInstance;
    const parentElementGroup = parentStepperComponent.elementControl.elementGroup;

    const parentStepChildren = parentElementGroup.childElementControls[0].childElementControls;
    const parentStepWithChildStepper = parentStepChildren[0];
    const childStepper = parentStepWithChildStepper.childElementControls[0];

    expect(parentStepChildren).toHaveLength(2);
    expect(parentStepWithChildStepper.childElementControls).toHaveLength(1);
    expect(childStepper.element.viewType).toBe('customStepper');

    // Test 1: Child stepper is NOT at last step, so parent button should NOT show
    let shouldShow = parentStepperComponent.shouldShowNextButton(1, parentStepWithChildStepper, parentStepChildren);
    expect(shouldShow).toBeFalsy();

    // Test 2: Child stepper is at last step, so parent button should SHOW
    parentStepperComponent.childOnLastStep.set(3, true);
    shouldShow = parentStepperComponent.shouldShowNextButton(1, parentStepWithChildStepper, parentStepChildren);
    expect(shouldShow).toBeTruthy();

    // Test 3: Simulate child stepper NOT at last step anymore
    parentStepperComponent.childOnLastStep.set(3, false);
    shouldShow = parentStepperComponent.shouldShowNextButton(
      1,
      parentStepWithChildStepper,
      parentElementGroup.childElementControls[0].childElementControls
    );
    expect(shouldShow).toBeFalsy();

    // Test 4: Non-last parent step should always show button (regardless of child state)
    shouldShow = parentStepperComponent.shouldShowNextButton(
      0,
      parentElementGroup.childElementControls[0].childElementControls[1],
      parentElementGroup.childElementControls[0].childElementControls
    );
    expect(shouldShow).toBeTruthy();
  });
});
