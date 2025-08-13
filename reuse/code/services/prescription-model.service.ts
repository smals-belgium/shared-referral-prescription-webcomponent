import { Injectable } from '@angular/core';
import { CreatePrescriptionModel } from '../interfaces';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PrescriptionModel, PrescriptionModelRequest, UpdatePrescriptionModel } from '@reuse/code/interfaces';
import { HttpCacheService } from './http-cache.service';

@Injectable({ providedIn: 'root' })
export class PrescriptionModelService {

  constructor(
    private readonly http: HttpClient,
    private readonly cacheHttpService: HttpCacheService
  ) {
  }

  createModel(createPrescriptionModel: CreatePrescriptionModel): Observable<any> {
    return this.http.post<void>('/prescriptionModels', createPrescriptionModel);
  }

  updateModel(prescriptionModalId: number, updatePrescriptionModel: UpdatePrescriptionModel){
    return this.http.patch<void>(`/prescriptionModels/${prescriptionModalId}`, updatePrescriptionModel);
  }

  deleteModel(prescriptionModelId: number) {
    return this.http.delete<void>(`/prescriptionModels/${prescriptionModelId}`);
  }

  findById(id: string): Observable<PrescriptionModel> {
    return this.http.get<PrescriptionModel>(`/prescriptionModels/${id}`);
  }

  getModelByName(label: string): Observable<PrescriptionModelRequest>{
    let params = new HttpParams()
          .set('label', label)
    return this.http.get<PrescriptionModelRequest>('/prescriptionModels', {params});
  }

  findAllModels(page: number, pageSize: number): Observable<PrescriptionModelRequest> {
    let httpParams = new HttpParams()
      .set('page', page)
      .set('pageSize', pageSize)
    return this.cacheHttpService.get<PrescriptionModelRequest>('/prescriptionModels', httpParams);
  }
}
