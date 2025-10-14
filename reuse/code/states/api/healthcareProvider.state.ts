import { inject, Injectable } from '@angular/core';
import { BaseState } from '../helpers/base.state';
import { HealthcareProviderService } from '@reuse/code/services/api/healthcareProvider.service';
import { SearchHealthcareProviderCriteria } from '@reuse/code/interfaces';
import { HealthCareProviderRequestResource } from '@reuse/code/openapi';

@Injectable({ providedIn: 'root' })
export class HealthcareProviderState extends BaseState<HealthCareProviderRequestResource> {
  private healthcareProviderService = inject(HealthcareProviderService);

  loadHealthcareProviders(criteria: SearchHealthcareProviderCriteria, page?: number, pageSize?: number) {
    const currentParams = this.state().params;
    pageSize = (pageSize ?? currentParams?.['pageSize']) || 10;
    page = (page ?? currentParams?.['page']) || 1;
    const params = { page, pageSize, criteria };
    this.load(
      this.healthcareProviderService.findAll(
        params.criteria.query,
        params.criteria.zipCodes,
        ['NURSE'],
        ['THIRD_PARTY_PAYING_GROUP', 'THIRD_PARTY_PAYING_GROUP', 'GUARD_POST', 'MEDICAL_HOUSE', 'HOME_SERVICES'],
        params.page,
        params.pageSize
      ),
      params
    );
  }
}
