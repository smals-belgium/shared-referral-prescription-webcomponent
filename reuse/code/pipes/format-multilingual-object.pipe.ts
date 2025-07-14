import { Pipe, PipeTransform } from '@angular/core';
import {Municipality, Street} from "../interfaces/healthcareProvider.interface";
import {Description} from "../interfaces";
import {OrganizationName, TypeDescription} from "../interfaces/organization.interface";

type Value = Street | Municipality | Description | OrganizationName | TypeDescription;
type LangPrefix = 'description' | 'municipality' | 'street' | 'name' | 'typeDesc';

@Pipe({name: 'formatMultilingualObject', standalone: true})
export class FormatMultilingualObjectPipe implements PipeTransform {

  transform(value: Value, langPrefix: LangPrefix, userLang?: string): string {
    if (!value) {
      return '';
    }

    let lang: 'fr' | 'nl' | 'de' = 'fr'

    if (userLang?.includes('nl')) {
      lang = 'nl';
    } else if (userLang?.includes('de')) {
      lang = 'de';
    }

    const valueAsKeyString = value as unknown as { [key: string]: string };

    const langMap = {
      fr: valueAsKeyString[`${langPrefix}Fr`],
      nl: valueAsKeyString[`${langPrefix}Nl`],
      de: valueAsKeyString[`${langPrefix}De`]
    };

    const userLangValue = langMap[lang];
    if (userLangValue && userLangValue.length > 1) {
      return userLangValue;
    }

    if (langMap.fr && langMap.fr.length > 1) {
      return langMap.fr;
    } else if (langMap.nl && langMap.nl.length > 1) {
      return langMap.nl;
    } else if (langMap.de && langMap.de.length > 1) {
      return langMap.de;
    }

    return '';
  }
}
