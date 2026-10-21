import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormTemplate } from '@smals-belgium-shared/vas-evaluation-form-ui-core';
import { EvfDynamicFormComponent } from '@smals-belgium-shared/vas-evaluation-form-ui-material/dynamic-form';

@Component({
  selector: 'evf-wrapper-auto-radio',
  imports: [EvfDynamicFormComponent],
  templateUrl: './auto-radio.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutoRadioComponent {
  @Input() demoTemplate!: FormTemplate;
  @Input() responses!: Record<string, unknown>;
}
