import { Component, Input } from '@angular/core';
import { EvfDynamicFormComponent } from '@smals-belgium-shared/vas-evaluation-form-ui-material/dynamic-form';
import { FormTemplate } from '@smals-belgium-shared/vas-evaluation-form-ui-core';

@Component({
  selector: 'evf-wrapper-expansion-panel-textarea',
  imports: [EvfDynamicFormComponent],
  templateUrl: './expansion-panel-textarea.component.html',
})
export class ExpansionPanelTextareaComponent {
  @Input() demoTemplate!: FormTemplate;
  @Input() responses!: Record<string, any>;
}
