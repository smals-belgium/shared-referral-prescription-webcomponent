import { Component, inject } from '@angular/core';
import { EvfTranslateService, Language } from '@smals-belgium-shared/vas-evaluation-form-ui-core';
import {
  EvfBaseFormDetailComponent,
  EvfDetailLabelComponent,
  EvfFormDetailLayoutComponent,
} from '@smals-belgium-shared/vas-evaluation-form-ui-material/elements/shared';

@Component({
  selector: 'evf-autocomplete-multiselect-detail',
  imports: [EvfFormDetailLayoutComponent, EvfDetailLabelComponent],
  templateUrl: './autocomplete-multiselect-detail.component.html',
})
export class AutocompleteMultiselectDetailComponent extends EvfBaseFormDetailComponent {
  private readonly evfTranslate = inject(EvfTranslateService);

  get currentLang(): Language {
    return this.evfTranslate.currentLang;
  }
}
