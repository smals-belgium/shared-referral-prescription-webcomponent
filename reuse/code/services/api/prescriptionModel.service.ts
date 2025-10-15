import { inject, Injectable } from '@angular/core';
import {
  CreateModelResource,
  ModelService as ApiModelService,
  PatchModelResource,
} from '@reuse/code/openapi';

@Injectable({ providedIn: 'root' })
export class PrescriptionModelService {
  private api = inject(ApiModelService);

  createModel(createModelResource: CreateModelResource) {
    return this.api.createPrescriptionModel(createModelResource);
  }

  updateModel(prescriptionModalId: number, patchModelResource: PatchModelResource) {
    return this.api.updatePrescriptionModel(prescriptionModalId, patchModelResource);
  }

  deleteModel(prescriptionModelId: number) {
    return this.api.deletePrescriptionModel(prescriptionModelId);
  }

  findById(id: number) {
    return this.api.getPrescriptionModel(id);
  }

  getModelByName(label: string) {
    return this.api.getAllPrescriptionModels(label);
  }

  findAll(page: number, pageSize: number) {
    return this.api.getAllPrescriptionModels(undefined, page, pageSize);
  }
}
