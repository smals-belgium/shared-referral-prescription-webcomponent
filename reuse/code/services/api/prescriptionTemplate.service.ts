import { inject, Injectable } from '@angular/core';
import { TemplateService as ApiTemplateService } from '@reuse/code/openapi';

@Injectable({ providedIn: 'root' })
export class PrescriptionTemplateService {
  private api = inject(ApiTemplateService);

  findAllTemplates() {
    return this.api.findTemplates();
  }

  findOneVersion(templateCode: string) {
    const version = 'latest';

    return this.api.findTemplateVersion(templateCode, version);
  }
}
