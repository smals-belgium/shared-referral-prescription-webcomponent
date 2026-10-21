import { Component, DestroyRef, inject, OnChanges, SimpleChanges } from '@angular/core';
import {
  BaseElementControl,
  EvfFormElementGroupComponent,
  EvfInternalEvent,
  EvfLabelPipe,
  Status,
} from '@smals-belgium-shared/vas-evaluation-form-ui-core';
import { EvfBaseFormElementComponent } from '@smals-belgium-shared/vas-evaluation-form-ui-material/elements/shared';
import { combineLatest, distinctUntilChanged, first, map, Observable, startWith, tap } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { EvfCardComponent } from '@smals-belgium-shared/vas-evaluation-form-ui-material/card';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { isStepperStepChangedData } from '@reuse/code/evf/utils/evf-utils';

interface StepFormSubmitted {
  [key: string]: boolean;
}

@Component({
  selector: 'evf-custom-stepper',
  imports: [AsyncPipe, EvfCardComponent, EvfLabelPipe, EvfFormElementGroupComponent, MatButtonModule, FormsModule],
  templateUrl: './custom-stepper.component.html',
  styleUrls: ['./custom-stepper.component.scss'],
})
export class CustomStepperComponent extends EvfBaseFormElementComponent implements OnChanges {
  private readonly destroyRef = inject(DestroyRef);
  private static counter = 0;
  currentStep: number[] = [0];
  validationPending = false;
  stepFormSubmitted: StepFormSubmitted | undefined = {};
  stepElementControls$: Observable<BaseElementControl[]> | undefined;
  stepElementControls: BaseElementControl[] = [];
  stepperType: 'multi-page' | 'single-page' = 'multi-page';

  readonly id = 'evf-evf-custom-stepper' + CustomStepperComponent.counter++;
  private readonly childOnLastStep = new Map<number, boolean>();
  private readonly disabledStateByUniqueId = new Map<number, boolean>();

  override ngOnChanges(changes: SimpleChanges): void {
    super.ngOnChanges(changes);
    if (changes['elementControl']) {
      this.setActiveStepsStream();
      this.setParams();
      this.watchTreeChanges();
    }
  }

  private setParams() {
    const custom = this.element.custom?.['stepperType'] as string;
    if (this.isStepperType(custom)) {
      this.stepperType = custom;
    }
  }

  private isStepperType(value: string): value is 'multi-page' | 'single-page' {
    return value === 'multi-page' || value === 'single-page';
  }

  private setActiveStepsStream() {
    const enabledStepFields$ = this.elementControl.childElementControls.map((elementControl: BaseElementControl) =>
      elementControl.statusChanges.pipe(
        startWith(elementControl.status),
        distinctUntilChanged(),
        map((status: Status) => (status === 'SKIPPED' ? (null as unknown as BaseElementControl) : elementControl)),
        tap((enabledField: BaseElementControl) => this.resetFormSubmitted(elementControl, enabledField !== null))
      )
    );

    this.stepElementControls$ = combineLatest(enabledStepFields$).pipe(
      map((elementControls: BaseElementControl[]) => elementControls.filter((f: BaseElementControl) => f !== null))
    );

    this.stepElementControls$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(controls => {
      this.stepElementControls = controls;

      const stepperType = controls[0].parent?.element?.custom?.['stepperType'] as string;
      const nextSteps = this.getInitialSteps(stepperType, controls);

      if (nextSteps.length) {
        this.currentStep = nextSteps;
      }
    });
  }

  private readonly stepIndexStrategies: Record<string, (controls: BaseElementControl[]) => number[]> = {
    'single-page': controls => controls.map((_, index) => index),
  };

  private getInitialSteps(stepperType: string | undefined, controls: BaseElementControl[]): number[] {
    const lastControl = controls.at(-1);
    if (!lastControl) {
      return [];
    }

    const hasAnsweredChild = lastControl.childElementControls.some(elementControl => elementControl.isAnswered());
    if (!hasAnsweredChild) {
      return [];
    }

    const strategy = stepperType ? this.stepIndexStrategies[stepperType] : undefined;
    return strategy ? strategy(controls) : [];
  }

  private resetFormSubmitted(field: BaseElementControl, active: boolean): void {
    if (!active) {
      this.stepFormSubmitted = { ...this.stepFormSubmitted };

      if (field.uniqueId) {
        this.stepFormSubmitted[field.uniqueId] = false;
      }
    }
  }

  previousStep() {
    if (this.stepperType === 'multi-page') {
      const step = this.currentStep[0];
      if (step > 0) {
        this.currentStep[0] = step - 1;
        this.emitStepChanged(false);
      }
    } else if (this.currentStep.length > 1) {
      this.currentStep.pop();
      this.emitStepChanged(false);
    }
  }

  nextStep(uniqueId?: number, htmlElement?: HTMLElement, stepIndex?: number, event?: Event) {
    if (event) event.preventDefault();

    if (!this.validationPending && !!uniqueId && uniqueId >= 0) {
      this.stepFormSubmitted = { ...this.stepFormSubmitted };
      this.stepFormSubmitted[uniqueId] = true;
      this.validationPending = true;

      const activeStepFormGroup = this.elementControl.elementGroup?.getByUniqueId(uniqueId);
      if (activeStepFormGroup) {
        activeStepFormGroup.markAllAsTouched();
        activeStepFormGroup.elementTreeStatusChanges
          .pipe(
            startWith(activeStepFormGroup.elementTreeStatus),
            first((status: Status) => status !== 'PENDING')
          )
          .subscribe((status: Status) => {
            this.validationPending = false;
            if (status === 'VALID') {
              let lastStep;
              // `currentStep` is modeled differently per stepper type:
              // - multi-page: only one step is active, so we advance the single stored index
              // - single-page: previously opened steps stay active, so a new step is appended only when moving forward from the last opened step
              if (this.stepperType === 'multi-page') {
                this.events.emit({ type: 'SCROLL_TO_TOP' });

                const step = this.currentStep[0];
                this.currentStep[0] = step + 1;
                lastStep = this.currentStep[0];
              } else {
                const lastValue = this.currentStep.at(-1);
                if (lastValue === undefined) {
                  return;
                }
                lastStep = lastValue;
                if (stepIndex == null || stepIndex === lastValue) {
                  this.currentStep.push(lastValue + 1);
                  lastStep = lastValue + 1;
                }
                this.disabledStateByUniqueId.set(uniqueId, true);
              }

              this.checkIfActionNeeded(activeStepFormGroup);

              const isLastStep = lastStep === this.stepElementControls.length - 1;
              this.emitStepChanged(isLastStep);
            } else {
              this.events.emit({ type: 'SCROLL_TO_INVALID', data: { htmlElement } });
            }
          });
      }
    }
  }

  private checkIfActionNeeded(activeStepFormGroup: BaseElementControl) {
    if (activeStepFormGroup.element?.custom?.['triggerTargetIdOnClickNext']) {
      const targetId = activeStepFormGroup.element.custom['triggerTargetIdOnClickNext'] as string;
      if (this.elementControl.elementGroup?.get(targetId).value === null) {
        this.elementControl.elementGroup?.get(targetId)?.setValue([]);
      } else {
        this.elementControl.elementGroup?.get(targetId)?.setValue(null);
      }
    }
  }

  private emitStepChanged(isLastStep: boolean): void {
    this.events.emit({
      type: 'STEPPER_STEP_CHANGED',
      data: {
        uniqueId: this.elementControl.uniqueId, // the stepper's own id, not the id of step itself
        lastStep: isLastStep,
      },
    });
  }

  handleEvent(event: EvfInternalEvent, stepElementControl: BaseElementControl, formElement: HTMLElement): void {
    if (event.type === 'STEPPER_STEP_CHANGED' && isStepperStepChangedData(event.data)) {
      this.childOnLastStep.set(event.data.uniqueId, event.data.lastStep);
    }

    switch (event.type) {
      case 'NEXT_STEP':
        this.nextStep(stepElementControl?.uniqueId, formElement);
        return;
      case 'PREVIOUS_STEP':
        this.previousStep();
        return;
      default:
        this.events.emit(event);
        return;
    }
  }

  shouldShowNextButton(
    stepIndex: number,
    stepElementControl: BaseElementControl,
    stepElementControls: BaseElementControl[]
  ): boolean {
    const childStepper = this.getNestedStepper(stepElementControl);

    if (childStepper?.uniqueId) {
      return this.childOnLastStep.get(childStepper.uniqueId) ?? false;
    }

    return stepIndex < stepElementControls.length - 1;
  }

  private getNestedStepper(stepElementControl: BaseElementControl): BaseElementControl | undefined {
    const children = stepElementControl.childElementControls;
    const isSingleNestedStepper =
      children?.length === 1 &&
      children[0]?.element?.viewType === 'customStepper' &&
      children[0].element.custom?.['showParentNextOnlyOnChildLastStep'] === true;

    return isSingleNestedStepper ? children[0] : undefined;
  }

  private watchTreeChanges() {
    if (this.stepperType === 'single-page') {
      for (const elementControl of this.stepElementControls) {
        const formGroup = elementControl;
        const uniqueId = elementControl.uniqueId;
        if (uniqueId) {
          this.disabledStateByUniqueId.set(uniqueId, false);
          formGroup.elementTreeValueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
            const currentState = this.disabledStateByUniqueId.get(uniqueId);

            if (currentState === true) {
              this.disabledStateByUniqueId.set(uniqueId, false);
            }
          });
        }
      }
    }
  }

  getDisabledState(uniqueId?: number): boolean {
    if (this.stepperType === 'multi-page') return false;
    if (uniqueId === undefined) return true;
    return this.disabledStateByUniqueId.get(uniqueId) ?? true;
  }

  isStepElementSubmitted(stepElementControl: BaseElementControl): boolean {
    return (
      this.submitted ||
      (!!this.stepFormSubmitted &&
        !!stepElementControl?.uniqueId &&
        !!this.stepFormSubmitted[stepElementControl.uniqueId])
    );
  }
}
