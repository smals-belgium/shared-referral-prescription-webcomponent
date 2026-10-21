import { inject, Injectable } from '@angular/core';
import {
  AutocompleteOption,
  EvfExternalSourceServiceInterface,
  ExternalSource,
  ExternalValidationResult,
} from '@smals-belgium-shared/vas-evaluation-form-ui-core';
import { Observable, of, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { mapAutocompleteOptions } from '@reuse/code/utils/autocomplete.utils';
import { TerminologyService } from './terminology.service';
import { EvfExternalSource } from '@reuse/code/interfaces';

@Injectable({
  providedIn: 'root',
})
export class ExternalSourceService implements EvfExternalSourceServiceInterface {
  private readonly terminologyService = inject(TerminologyService);

  handleAutocomplete(externalSource: ExternalSource, value: string): Observable<AutocompleteOption[]> {
    value = value.toLowerCase();
    if (value === 'failed') {
      return throwError(() => 'FAILED');
    }

    if (!externalSource.dataUrl) {
      return throwError(() => 'No external source provided!');
    }

    const formObject = JSON.parse(value) as EvfExternalSource;
    const searchValue = formObject.query;

    if (externalSource.dataUrl.includes('terminology/valueSet/')) {
      const match = externalSource.dataUrl.match(/terminology\/valueSet\/([^/?]+)/);
      const valueSetId = match ? match[1] : null;
      if (!valueSetId) {
        return throwError(() => 'No value set id provided!');
      }

      return this.terminologyService
        .getValueSet(valueSetId, searchValue)
        .pipe(map(result => mapAutocompleteOptions(result)));
    }

    return throwError(() => 'No correct path provided!');
  }

  handleSelectOptions(externalSource: ExternalSource): Observable<AutocompleteOption[]> {
    if (!externalSource.dataUrl) {
      return throwError(() => 'No external source provided!');
    }

    if (externalSource.dataUrl.includes('terminology/valueSet/')) {
      const match = externalSource.dataUrl.match(/terminology\/valueSet\/([^/?]+)/);
      const valueSetId = match ? match[1] : null;
      if (!valueSetId) {
        return throwError(() => 'No value set id provided!');
      }

      return this.terminologyService.getValueSet(valueSetId).pipe(map(result => mapAutocompleteOptions(result)));
    }

    return throwError(() => 'No correct path provided!');
  }

  handleValidation(_externalSource: ExternalSource, _value: any): Observable<ExternalValidationResult> {
    // implement when needed
    return of({ valid: true });
  }
}
