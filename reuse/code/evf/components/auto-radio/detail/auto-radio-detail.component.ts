import { Component, inject } from '@angular/core';
import { Language } from '@ngx-translate/core';
import { EvfTranslateService } from '@smals-belgium-shared/vas-evaluation-form-ui-core';
import {
  EvfBaseFormDetailComponent,
  EvfDetailLabelComponent,
  EvfFormDetailLayoutComponent,
} from '@smals-belgium-shared/vas-evaluation-form-ui-material/elements/shared';

@Component({
  selector: 'evf-auto-radio-detail',
  imports: [EvfFormDetailLayoutComponent, EvfDetailLabelComponent],
  templateUrl: './auto-radio-detail.component.html',
})
export class AutoRadioDetailComponent extends EvfBaseFormDetailComponent {
  private readonly evfTranslate = inject(EvfTranslateService);

  get currentLang(): Language {
    return this.evfTranslate.currentLang;
  }
}
