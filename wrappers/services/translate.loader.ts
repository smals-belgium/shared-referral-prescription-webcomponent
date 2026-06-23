import { TranslateLoader } from '@ngx-translate/core';
import { of } from 'rxjs';
import * as nlBe from '../assets/nl_BE.json';
import * as frBe from '../assets/fr_BE.json';
import * as deDe from '../assets/de_DE.json';
import * as enGB from '../assets/en_GB.json';

export class WcTranslateLoader implements TranslateLoader {
  public getTranslation(lang: string) {
    switch (lang.toLowerCase().substring(0, 2)) {
      case 'nl':
        return of(nlBe);
      case 'fr':
        return of(frBe);
      case 'de':
        return of(deDe);
      case 'en':
        return of(enGB);
      default:
        return of(nlBe);
    }
  }
}
