import { inject, Injectable } from '@angular/core';
import {
  HealthCareProviderService as ApiHealthCareProviderService,
  LanguageCode,
  ProviderType,
} from '@reuse/code/openapi';

@Injectable({ providedIn: 'root' })
export class HealthcareProviderService {
  private readonly api = inject(ApiHealthCareProviderService);

  findAll(
    query: string,
    zipCodes: number[],
    disciplines: string[],
    institutionTypes?: string[],
    providerType: ProviderType = ProviderType.All,
    prescriptionId?: string,
    intent?: string,
    language?: LanguageCode,
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
      intent,
      ['name'],
      language,
      page,
      pageSize
    );
  }
}
