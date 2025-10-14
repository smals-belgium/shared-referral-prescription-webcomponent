import { Component, Input } from '@angular/core';
import { EvfDynamicFormComponent } from '@smals/vas-evaluation-form-ui-material/dynamic-form';
import { FormTemplate } from '@smals/vas-evaluation-form-ui-core';

@Component({
  selector: 'evf-wrapper-autocomplete-multiselect',
  imports: [EvfDynamicFormComponent],
  templateUrl: './autocomplete-multiselect.component.html',
})
export class AutocompleteMultiselectComponent {
  @Input() demoTemplate!: FormTemplate;
  @Input() responses!: Record<string, any>;
}
