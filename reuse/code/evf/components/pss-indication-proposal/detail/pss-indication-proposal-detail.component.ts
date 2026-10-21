import { Component, inject } from '@angular/core';
import { EvfTranslateService, Language } from '@smals-belgium-shared/vas-evaluation-form-ui-core';
import {
  EvfBaseFormDetailComponent,
  EvfDetailLabelComponent,
  EvfFormDetailLayoutComponent,
} from '@smals-belgium-shared/vas-evaluation-form-ui-material/elements/shared';

@Component({
  selector: 'evf-pss-indication-proposal-detail',
  imports: [EvfFormDetailLayoutComponent, EvfDetailLabelComponent],
  templateUrl: './pss-indication-proposal-detail.component.html',
})
export class PssIndicationProposalDetailComponent extends EvfBaseFormDetailComponent {
  private readonly evfTranslate = inject(EvfTranslateService);

  get currentLang(): Language {
    return this.evfTranslate.currentLang;
  }
}
