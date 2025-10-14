import { inject, Injectable } from '@angular/core';
import { of, switchMap } from 'rxjs';
import { HttpCacheService } from '@reuse/code/services/cache/http-cache.service';
import {
  CreateModelResource,
  ModelService as ApiModelService,
  PageModelEntityDto,
  PatchModelResource,
} from '@reuse/code/openapi';

@Injectable({ providedIn: 'root' })
export class PrescriptionModelService {
  private api = inject(ApiModelService);
  private cacheHttpService = inject(HttpCacheService);

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

  findAllModels(page: number, pageSize: number) {
    const url = `/prescriptionModels?page=${page}&pageSize=${pageSize}`;

    return this.cacheHttpService.loadFromCache<PageModelEntityDto>(url, 30).pipe(
      switchMap(cachedData => {
        if (cachedData) {
          return of(cachedData);
        }

        return this.api
          .getAllPrescriptionModels(undefined, page, pageSize)
          .pipe(switchMap(data => this.cacheHttpService.save(url, data)));
      })
    );
  }
}
