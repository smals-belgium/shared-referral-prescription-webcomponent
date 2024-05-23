import { EvfTemplate } from '../interfaces';
import { Injectable } from '@angular/core';
import { PrescriptionTemplateService } from '../services/prescription-template.service';
import { BaseState } from './base.state';

@Injectable({providedIn: 'root'})
export class TemplatesState extends BaseState<EvfTemplate[]> {

  constructor(
    private prescriptionTemplateService: PrescriptionTemplateService
  ) {
    super()
  }

  loadTemplates() {
    this.load(this.prescriptionTemplateService.findAllTemplates());
  }

}
