import { Injectable } from '@angular/core';
import { BaseState } from './base.state';
import { PrescriptionModelRequest } from '@reuse/code/interfaces';
import { PrescriptionModelService } from '../services/prescription-model.service';

@Injectable({providedIn: 'root'})
export class ModelsState extends BaseState<PrescriptionModelRequest> {

  constructor(
    private readonly prescriptionModelService: PrescriptionModelService
  ) {
    super()
  }

  loadModels(page: number, pageSize: number) {
    this.load(this.prescriptionModelService.findAllModels(page, pageSize));
  }

}
