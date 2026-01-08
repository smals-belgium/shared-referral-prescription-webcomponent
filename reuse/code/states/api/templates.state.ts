import { inject, Injectable } from '@angular/core';
import { PrescriptionTemplateService } from '@reuse/code/services/api/prescriptionTemplate.service';
import { BaseState } from '@reuse/code/states/helpers/base.state';
import { Template } from '@reuse/code/openapi';

@Injectable({ providedIn: 'root' })
export class TemplatesState extends BaseState<Template[]> {
  private prescriptionTemplateService = inject(PrescriptionTemplateService);

  loadTemplates() {
    this.load(this.prescriptionTemplateService.findAllTemplates());
  }
}
