import { inject, Injectable } from '@angular/core';
import { BaseState } from '@reuse/code/states/helpers/base.state';
import { PrescriptionModelService } from '@reuse/code/services/api/prescriptionModel.service';
import { PageModelEntityDto } from '@reuse/code/openapi';

@Injectable({ providedIn: 'root' })
export class ModelsState extends BaseState<PageModelEntityDto> {
  private prescriptionModelService = inject(PrescriptionModelService);

  loadModels(page: number, pageSize: number) {
    this.load(this.prescriptionModelService.findAllModels(page, pageSize));
  }
}
