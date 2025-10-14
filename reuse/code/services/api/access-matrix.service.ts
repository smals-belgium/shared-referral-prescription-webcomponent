import { inject, Injectable } from '@angular/core';
import { AccessMatrixService as ApiAccessMatrixService } from '@reuse/code/openapi';

@Injectable({ providedIn: 'root' })
export class AccessMatrixService {
  private api = inject(ApiAccessMatrixService);

  getMatrix() {
    return this.api.getMatrix();
  }
}
