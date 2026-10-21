import { Component, inject } from '@angular/core';
import { Language } from '@ngx-translate/core';
import { EvfLabelPipe, EvfTranslateService } from '@smals-belgium-shared/vas-evaluation-form-ui-core';
import {
  EvfBaseFormDetailComponent,
  EvfDetailLabelComponent,
  EvfFormDetailLayoutComponent,
} from '@smals-belgium-shared/vas-evaluation-form-ui-material/elements/shared';

@Component({
  selector: 'evf-custom-checkbox-list-detail',
  imports: [EvfFormDetailLayoutComponent, EvfDetailLabelComponent, EvfLabelPipe],
  templateUrl: './custom-checkbox-list-detail.component.html',
})
export class CustomCheckboxListDetailComponent extends EvfBaseFormDetailComponent {
  private readonly evfTranslate = inject(EvfTranslateService);

  get currentLang(): Language {
    return this.evfTranslate.currentLang;
  }

  getTranslation(value: string) {
    const response = this.elementControl.responses?.find(r => r.value === value);
    return response?.labelTranslationId;
  }
}
