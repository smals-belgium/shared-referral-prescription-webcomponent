import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { EvfDynamicFormComponent } from '@smals-belgium-shared/vas-evaluation-form-ui-material/dynamic-form';
import { FormTemplate } from '@smals-belgium-shared/vas-evaluation-form-ui-core';

@Component({
  selector: 'evf-wrapper-pss-indication-proposal',
  imports: [EvfDynamicFormComponent],
  templateUrl: './pss-indication-proposal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PssIndicationProposalComponent {
  @Input() demoTemplate!: FormTemplate;
  @Input() responses!: Record<string, any>;
}
