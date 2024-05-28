import { TranslateLoader } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import * as nlBe from '../../assets/i18n-common/nl-BE.json';
import * as frBe from '../../assets/i18n-common/fr-BE.json';

export class WcTranslateLoader implements TranslateLoader {

  public getTranslation(lang: string): Observable<Object> {
    switch (lang.toLowerCase().substring(0, 2)) {
      case 'nl':
        return of(nlBe);
      case 'fr':
        return of(frBe);
      default:
        throw new Error("Language not supported: " + lang)
    }
  }
}
