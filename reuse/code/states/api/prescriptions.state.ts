import { inject, Injectable } from '@angular/core';
import { SearchPrescriptionCriteria } from '@reuse/code/interfaces';
import { BaseState } from '@reuse/code/states/helpers/base.state';
import { PrescriptionService } from '@reuse/code/services/api/prescription.service';
import { ReadRequestListResource } from '@reuse/code/openapi';

@Injectable({ providedIn: 'root' })
export class PrescriptionsState extends BaseState<ReadRequestListResource> {
  private readonly prescriptionService = inject(PrescriptionService);

  loadPrescriptions(
    criteria?: SearchPrescriptionCriteria,
    page?: number,
    pageSize?: number,
    rawPatientSsin?: string
  ): void {
    const currentParams = this.state().params;
    pageSize = pageSize || currentParams?.['pageSize'] || 10;
    page =
      rawPatientSsin && rawPatientSsin === currentParams?.['rawPatientSsin']
        ? page || currentParams?.['page'] || 1
        : page || 1;

    const params = { page, pageSize, criteria, rawPatientSsin };
    this.load(this.prescriptionService.findAll(params.criteria, params.page, params.pageSize), params);
  }
}
