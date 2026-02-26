import { TranslateLoader } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import * as nlBe from '../assets/nl-BE.json';
import * as frBe from '../assets/fr-BE.json';

export class WcTranslateLoader implements TranslateLoader {
  public getTranslation(lang: string) {
    switch (lang.toLowerCase().substring(0, 2)) {
      case 'nl':
        return of(nlBe);
      case 'fr':
        return of(frBe);
      default:
        return throwError(() => new Error(`Language not supported: ${lang}`));
    }
  }
}
