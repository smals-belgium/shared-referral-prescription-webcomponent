import { TranslateLoader } from '@ngx-translate/core';
import { of } from 'rxjs';
import * as nlBe from '@reuse/assets/i18n-common/nl-BE.json';
import * as frBe from '@reuse/assets/i18n-common/fr-BE.json';

export class WcTranslateLoader implements TranslateLoader {
  public getTranslation(lang: string) {
    switch (lang.toLowerCase().substring(0, 2)) {
      case 'nl':
        return of(nlBe);
      case 'fr':
        return of(frBe);
      default:
        throw new Error('Language not supported: ' + lang);
    }
  }
}
