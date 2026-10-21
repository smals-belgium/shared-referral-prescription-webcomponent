import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { EvfDynamicFormComponent } from '@smals-belgium-shared/vas-evaluation-form-ui-material/dynamic-form';
import { FormTemplate } from '@smals-belgium-shared/vas-evaluation-form-ui-core';

@Component({
  selector: 'evf-wrapper-custom-stepper',
  imports: [EvfDynamicFormComponent],
  templateUrl: './custom-stepper.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomStepperComponent {
  demoTemplate = input<FormTemplate>();
  responses = input<Record<string, any>>();
}
