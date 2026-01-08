import { inject, Injectable } from '@angular/core';
import { tap } from 'rxjs/operators';
import { PersonResource, PersonSearchCriteria, PersonService as ApiPersonService } from '@reuse/code/openapi';
import { of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PersonService {
  private api = inject(ApiPersonService);
  private cache: Record<string, PersonResource> = {};

  findAll(criteria: PersonSearchCriteria) {
    return this.api.findPersons(criteria);
  }

  findOne(ssin: string) {
    if (this.cache[ssin]) {
      return of(this.cache[ssin]);
    }
    return this.api.findPerson(ssin).pipe(tap(person => (this.cache[ssin] = person)));
  }
}
