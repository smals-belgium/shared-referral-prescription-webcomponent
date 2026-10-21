import { inject, Injectable } from '@angular/core';
import { TerminologyService as ApiTerminologyService, ValueSetId } from '@reuse/code/openapi';

@Injectable({ providedIn: 'root' })
export class TerminologyService {
  private readonly api = inject(ApiTerminologyService);

  private isValueSetId(value: string): value is ValueSetId {
    return Object.values(ValueSetId).includes(value as ValueSetId);
  }

  getValueSet(valueSetId: string, search?: string) {
    if (!this.isValueSetId(valueSetId)) {
      throw new Error(`Unknown valueSetId: ${valueSetId}`);
    }
    return this.api.getValueSet(valueSetId, search);
  }
}
