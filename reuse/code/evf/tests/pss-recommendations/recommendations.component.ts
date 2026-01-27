import { Component, Input } from '@angular/core';
import { EvfDynamicFormComponent } from '@smals-belgium-shared/vas-evaluation-form-ui-material/dynamic-form';
import { FormTemplate } from '@smals-belgium-shared/vas-evaluation-form-ui-core';

@Component({
  selector: 'evf-wrapper-recommendations',
  imports: [EvfDynamicFormComponent],
  templateUrl: './recommendations.component.html',
})
export class RecommendationsComponent {
  @Input() demoTemplate!: FormTemplate;
  @Input() responses!: Record<string, any>;
}
