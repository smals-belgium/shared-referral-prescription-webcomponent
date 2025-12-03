import { WritableSignal } from '@angular/core';
import {Lang} from '@reuse/code/interfaces/lang.enum';

export function handleMissingTranslationFile(langAlertData: WritableSignal<{ title: string; body: string } | null>, currentLang: string){

  const TITLE_EN: string = 'English translation coming soon.';
  const BODY_EN: string = 'In the meantime, you can view the content in Dutch or French.';

  const TITLE_DE: string = 'Deutsche Übersetzung folgt in Kürze.';
  const BODY_DE: string = 'In der Zwischenzeit können Sie die Inhalte auf Niederländisch oder Französisch ansehen.';

  const TITLE_FR: string = 'Traduction en français à venir.';
  const BODY_FR: string = 'Veuillez consulter les pages en néerlandais et en allemand en attendant.';

  const TITLE_NL: string = 'De Nederlandse vertaling ontbreekt.';
  const BODY_NL: string = 'In de tussentijd kunt u de inhoud in het Frans of in het Duits bekijken.';


  switch (currentLang) {
    case Lang.DE:
      langAlertData.set({
        title: TITLE_DE,
        body: BODY_DE,
      });
      break;
    case Lang.EN:
      langAlertData.set({
        title: TITLE_EN,
        body: BODY_EN,
      });
      break;
    case Lang.NL:
      langAlertData.set({
        title: TITLE_NL,
        body: BODY_NL,
      });
      break;
    case Lang.FR:
      langAlertData.set({
        title: TITLE_FR,
        body: BODY_FR,
      });
      break;

    default:
      langAlertData.set({
        title: 'Unknown lang',
        body: `Unable to find translation for that lang : ${currentLang}`,
      });
      break;
  }
}
