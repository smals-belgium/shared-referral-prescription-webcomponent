import { Injectable } from '@angular/core';
import { SearchPrescriptionCriteria } from '../interfaces';
import { BaseState } from './base.state';
import { PrescriptionSummaryList } from '../interfaces/prescription-summary.interface';
import { PrescriptionService } from "../services/prescription.service";

@Injectable({providedIn: 'root'})
export class PrescriptionsState extends BaseState<PrescriptionSummaryList> {

  constructor(
    private prescriptionService: PrescriptionService
  ) {
    super();
  }

  loadPrescriptions(
    criteria?: SearchPrescriptionCriteria,
    page?: number,
    pageSize?: number
  ): void {
    const currentParams = this.state().params;
    pageSize = pageSize || currentParams?.['pageSize'] || 10;
    page = criteria?.patient === currentParams?.['criteria']?.['patient']
      ? page || currentParams?.['page'] || 1
      : page || 1;

    const params = {page, pageSize, criteria};
    this.load(
      this.prescriptionService.findAll(params.criteria, params.page, params.pageSize, false),
      params
    );
  }

}
