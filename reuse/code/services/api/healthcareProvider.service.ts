import { inject, Injectable } from '@angular/core';
import { HealthCareProviderService as ApiHealthCareProviderService } from '@reuse/code/openapi';

@Injectable({ providedIn: 'root' })
export class HealthcareProviderService {
  private api = inject(ApiHealthCareProviderService);

  findAll(
    query: string,
    zipCodes: number[],
    disciplines: string[],
    institutionTypes: string[],
    page?: number,
    pageSize?: number
  ) {
    return this.api.findHealthCareProviders(
      undefined,
      query,
      zipCodes.map(String),
      disciplines,
      institutionTypes,
      page,
      pageSize
    );
  }
}
