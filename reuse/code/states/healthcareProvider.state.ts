import { Injectable } from '@angular/core';
import { BaseState } from './base.state';
import { HealthcareProviderService } from "../services/healthcareProvider.service";
import { HealthcareProviderList, SearchHealthcareProviderCriteria } from "../interfaces/healthcareProvider.interface";

@Injectable({providedIn: 'root'})
export class HealthcareProviderState extends BaseState<HealthcareProviderList> {

  constructor(
    private readonly healthcareProviderService: HealthcareProviderService
  ) {
    super();
  }

  loadHealthcareProviders(
    criteria: SearchHealthcareProviderCriteria,
    page?: number,
    pageSize?: number
  ): void {
    const currentParams = this.state().params;
    pageSize = (pageSize ?? currentParams?.['pageSize']) ?? 10;
    page = (page ?? currentParams?.['page']) ?? 1;
    const params = {page, pageSize, criteria};
    this.load(
      this.healthcareProviderService.findAll(params.criteria.query, params.criteria.zipCodes, ['NURSE'],['THIRD_PARTY_PAYING_GROUP', 'THIRD_PARTY_PAYING_GROUP', 'GUARD_POST', 'MEDICAL_HOUSE', 'HOME_SERVICES'], params.page, params.pageSize),
      params
    );
  }

}
