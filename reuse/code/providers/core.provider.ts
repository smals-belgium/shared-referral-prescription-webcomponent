import { importProvidersFrom } from '@angular/core';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { EVF_MATERIAL_DATE_OPTIONS } from '@smals-belgium-shared/vas-evaluation-form-ui-material/elements/date';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MAT_LUXON_DATE_FORMATS } from '@angular/material-luxon-adapter';
import { EvfLuxonDateAdapter } from '@smals-belgium-shared/vas-evaluation-form-ui-material';

export function provideCore() {
  return [
    importProvidersFrom(MatSnackBarModule),
    {
      provide: EVF_MATERIAL_DATE_OPTIONS,
      useValue: {
        dateDetail: 'D',
      },
    },
    { provide: MAT_DATE_LOCALE, useValue: 'fr-BE' },
    { provide: MAT_DATE_FORMATS, useValue: MAT_LUXON_DATE_FORMATS },
    { provide: DateAdapter, useClass: EvfLuxonDateAdapter, deps: [MAT_DATE_LOCALE] },
  ];
}
