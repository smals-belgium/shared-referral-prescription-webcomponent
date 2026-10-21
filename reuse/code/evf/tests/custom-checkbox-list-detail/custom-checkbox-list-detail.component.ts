import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormTemplate } from '@smals-belgium-shared/vas-evaluation-form-ui-core';
import { EvfSummaryComponent } from '@smals-belgium-shared/vas-evaluation-form-ui-material/summary';

@Component({
  selector: 'evf-wrapper-custom-checkbox-list-detail',
  imports: [EvfSummaryComponent],
  templateUrl: './custom-checkbox-list-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomCheckboxListDetailComponent {
  @Input() demoTemplate!: FormTemplate;
  @Input() responses!: Record<string, unknown>;
}
