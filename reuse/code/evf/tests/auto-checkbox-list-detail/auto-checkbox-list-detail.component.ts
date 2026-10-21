import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormTemplate } from '@smals-belgium-shared/vas-evaluation-form-ui-core';
import { EvfSummaryComponent } from '@smals-belgium-shared/vas-evaluation-form-ui-material/summary';

@Component({
  selector: 'evf-wrapper-auto-checkbox-list-detail',
  imports: [EvfSummaryComponent],
  templateUrl: './auto-checkbox-list-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutoCheckboxListDetailComponent {
  @Input() demoTemplate!: FormTemplate;
  @Input() responses!: Record<string, unknown>;
}
