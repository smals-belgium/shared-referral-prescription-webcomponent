import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormTemplate } from '@smals-belgium-shared/vas-evaluation-form-ui-core';
import { EvfDynamicFormComponent } from '@smals-belgium-shared/vas-evaluation-form-ui-material/dynamic-form';

@Component({
  selector: 'evf-wrapper-auto-checkbox-list',
  imports: [EvfDynamicFormComponent],
  templateUrl: './auto-checkbox-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutoCheckboxListComponent {
  @Input() demoTemplate!: FormTemplate;
  @Input() responses!: Record<string, unknown>;
}
