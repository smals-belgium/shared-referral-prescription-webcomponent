import { Component, input } from '@angular/core';
import { EvfDynamicFormComponent } from '@smals-belgium-shared/vas-evaluation-form-ui-material/dynamic-form';
import { FormTemplate } from '@smals-belgium-shared/vas-evaluation-form-ui-core';

@Component({
  selector: 'assign-professional-button',
  imports: [EvfDynamicFormComponent],
  templateUrl: './assign-professional-button.component.html',
  styleUrl: './assign-professional-button.component.scss',
})
export class AssignProfessionalButtonComponent {
  demoTemplate = input<FormTemplate>();
  responses = input<Record<string, unknown>>();
}
