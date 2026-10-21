import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormTemplate } from '@smals-belgium-shared/vas-evaluation-form-ui-core';
import { EvfSummaryComponent } from '@smals-belgium-shared/vas-evaluation-form-ui-material/summary';

@Component({
  selector: 'evf-wrapper-autocomplete-multiselect-detail',
  imports: [EvfSummaryComponent],
  templateUrl: './autocomplete-multiselect-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutocompleteMultiselectDetailComponent {
  @Input() demoTemplate!: FormTemplate;
  @Input() responses!: Record<string, unknown>;
}
