import { inject, Injectable } from '@angular/core';
import { ProfessionalService as ApiProfessionalService } from '@reuse/code/openapi';

@Injectable({ providedIn: 'root' })
export class ProfessionalService {
  private api = inject(ApiProfessionalService);

  findAll(query: string, zipCodes: string[], disciplines: string[]) {
    return this.api.findProfessionals(undefined, query, zipCodes, disciplines);
  }

}
