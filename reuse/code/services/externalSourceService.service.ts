import { Injectable } from "@angular/core";
import {
  AutocompleteOption,
  EvfExternalSourceServiceInterface,
  ExternalSource,
  ExternalValidationResult
} from "@smals/vas-evaluation-form-ui-core";
import { Observable, of, throwError } from "rxjs";
import { HttpParams } from "@angular/common/http";
import { map } from "rxjs/operators";
import { PssService } from "./pss.service";

@Injectable({
  providedIn: 'root'
})
export class ExternalSourceService implements EvfExternalSourceServiceInterface {

  constructor(private pssService: PssService) {
  }

  handleAutocomplete(externalSource: ExternalSource, value: string): Observable<AutocompleteOption[]> {
    value = value.toLowerCase();
    if (value === 'failed') {
      return throwError(() => 'FAILED')
    }

    if(!externalSource.dataUrl){
      return throwError(() => 'No external source provided!')
    }

    if (externalSource.dataUrl.includes('pss/radiology/indications')) {
      const formObject = JSON.parse(value);
      const query = formObject.query;

      const indications: string[] = [ query ];

      const indicationsParam = indications.join(',');

      const params = new HttpParams()
        .set('indications', indicationsParam);

      return this.pssService.getIndications(externalSource.dataUrl, params)
        .pipe(map(result => result.indications));
    }

    if (externalSource.dataUrl.includes('/pss/radiology/procedures')) {
      const params = new HttpParams()
        .set('intention', value)

      return this.pssService.getIntentions(externalSource.dataUrl, params)
        .pipe(map(result => {
          return result.intentions
        }));
    }

    const params = new HttpParams()
      .set('query', value)

    return this.pssService.geDefault(externalSource.dataUrl, params)
      .pipe(map(result => {
        return result
      }));
  }

  handleValidation(externalSource: ExternalSource, value: any): Observable<ExternalValidationResult> {
    // implement when needed
    return of({valid: true});
  }

  getGender(gender: string | undefined) {
    if (gender?.toLowerCase() === 'f') {
      return 'female'
    }
    return 'male'
  }
}
