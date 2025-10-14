import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { GeographyService as ApiGeographyService } from '@reuse/code/openapi';

@Injectable({ providedIn: 'root' })
export class GeographyService {
  private api = inject(ApiGeographyService);

  findAll(zipCodeOrCityName: string) {
    return this.api.findCities(zipCodeOrCityName).pipe(map(result => result.items));
  }
}
