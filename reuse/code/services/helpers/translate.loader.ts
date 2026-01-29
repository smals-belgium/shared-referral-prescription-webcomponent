import { TranslateLoader } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import * as nlBe from '@reuse/assets/i18n-common/nl_BE.json';
import * as frBe from '@reuse/assets/i18n-common/fr_BE.json';
import * as enGB from '@reuse/assets/i18n-common/en_GB.json';
import * as deDE from '@reuse/assets/i18n-common/de_DE.json';

export class WcTranslateLoader implements TranslateLoader {
  public getTranslation(lang: string) {
    switch (lang.toLowerCase().substring(0, 2)) {
      case 'nl':
        return of(nlBe);
      case 'fr':
        return of(frBe);
      case 'en':
        return of(enGB);
      case 'de':
        return of(deDE);
      default:
        return throwError(() => new Error(`Language not supported: ${lang}`));
    }
  }
}
