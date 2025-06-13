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
      const formValues = formObject.formvalues;
      const selectedValues = formObject.selectedvalues;

      const pssStatus = this.pssService.getStatus();
      const hasPssIndications = Array.isArray(selectedValues) && selectedValues.length > 0;

      if (!formValues.age && !formValues.gender) {
        return throwError(() => new Error('NO_AGE_OR_GENDER_SPECIFIED'));
      }

      if (!formValues.gender) {
        return throwError(() => new Error('NO_GENDER_SPECIFIED'));
      }

      if (!formValues.age) {
        return throwError(() => new Error('NO_AGE_SPECIFIED'));
      }

      const indications = [query]
      let age = formValues.age;
      let gender = this.getGender(formValues.gender);


      const params = new HttpParams()
        .set('age', age)
        .set('gender', gender)
        .set('indications', JSON.stringify(indications))
        .set('hasIndications', hasPssIndications)
        .set('status', pssStatus);

      return this.pssService.getIndications(externalSource.dataUrl, params)
        .pipe(map(result => {
          if (!hasPssIndications || !this.pssService.getPssSessionId()) {
            this.pssService.setPssSessionId(result.sessionId)
          }

          return result.indications
        }));
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
