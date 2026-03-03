import { Injectable } from '@angular/core';
import {
  AutocompleteOption,
  EvfExternalSourceServiceInterface,
  ExternalSource,
  ExternalValidationResult,
} from '@smals-belgium-shared/vas-evaluation-form-ui-core';
import { Observable, of, throwError } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { PssService } from '@reuse/code/services/api/pss.service';
import { mapAutocompleteOptions } from '@reuse/code/utils/autocomplete.utils';

@Injectable({
  providedIn: 'root',
})
export class ExternalSourceService implements EvfExternalSourceServiceInterface {
  constructor(private pssService: PssService) {}

  handleAutocomplete(externalSource: ExternalSource, value: string): Observable<AutocompleteOption[]> {
    value = value.toLowerCase();
    if (value === 'failed') {
      return throwError(() => 'FAILED');
    }

    if (!externalSource.dataUrl) {
      return throwError(() => 'No external source provided!');
    }

    if (externalSource.dataUrl.includes('pss/radiology/indications')) {
      const formObject = JSON.parse(value);
      const query = formObject.query;

      const indications: string[] = [query];

      return this.pssService
        .getIndications(indications)
        .pipe(map(result => mapAutocompleteOptions(result.indications)));
    }

    if (externalSource.dataUrl.includes('/pss/radiology/procedures')) {
      return this.pssService.getIntentions(value).pipe(
        map(result => {
          return mapAutocompleteOptions(result.intentions);
        })
      );
    }

    const params = new HttpParams().set('query', value);

    return this.pssService.geDefault(externalSource.dataUrl, params).pipe(
      map(result => {
        return result;
      })
    );
  }

  handleValidation(externalSource: ExternalSource, value: any): Observable<ExternalValidationResult> {
    // implement when needed
    return of({ valid: true });
  }

  getGender(gender: string | undefined) {
    if (gender?.toLowerCase() === 'f') {
      return 'female';
    }
    return 'male';
  }
}
