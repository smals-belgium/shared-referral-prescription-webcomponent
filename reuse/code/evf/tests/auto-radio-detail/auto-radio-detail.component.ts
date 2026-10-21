import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormTemplate } from '@smals-belgium-shared/vas-evaluation-form-ui-core';
import { EvfSummaryComponent } from '@smals-belgium-shared/vas-evaluation-form-ui-material/summary';

@Component({
  selector: 'evf-wrapper-auto-radio-detail',
  imports: [EvfSummaryComponent],
  templateUrl: './auto-radio-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutoRadioDetailComponent {
  @Input() demoTemplate!: FormTemplate;
  @Input() responses!: Record<string, unknown>;
}
