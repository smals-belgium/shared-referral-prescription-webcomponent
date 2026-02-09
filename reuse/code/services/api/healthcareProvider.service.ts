import { inject, Injectable } from '@angular/core';
import { HealthCareProviderService as ApiHealthCareProviderService, ProviderType } from '@reuse/code/openapi';

@Injectable({providedIn: 'root'})
export class HealthcareProviderService {
  private api = inject(ApiHealthCareProviderService);

  findAll(
    query: string,
    zipCodes: number[],
    disciplines: string[],
    institutionTypes?: string[],
    providerType: ProviderType = ProviderType.All,
    prescriptionId?: string,
    page?: number,
    pageSize?: number
  ) {
    return this.api.findHealthCareProviders(
      undefined,
      query,
      zipCodes.map(String),
      providerType,
      disciplines ?? undefined,
      institutionTypes ?? undefined,
      prescriptionId,
      page,
      pageSize
    );
  }
}
