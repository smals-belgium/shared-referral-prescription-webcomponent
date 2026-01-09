import { inject, Injectable } from '@angular/core';
import { AccessMatrix } from '@reuse/code/openapi';
import { BaseState } from '@reuse/code/states/helpers/base.state';
import { Observable } from 'rxjs';
import { AccessMatrixService } from '@reuse/code/services/api/access-matrix.service';

export type Permissions = keyof Omit<AccessMatrix, 'quality' | 'templateName'>;

@Injectable({ providedIn: 'root' })
export class AccessMatrixState extends BaseState<AccessMatrix[]> {
  private accessMatrixApiService = inject(AccessMatrixService);

  loadAccessMatrix(): Observable<AccessMatrix[]> {
    return this.load(this.accessMatrixApiService.getMatrix());
  }

  hasAtLeastOnePermission(permissions: Permissions[], templateCode?: string): boolean {
    if (!templateCode) {
      return false;
    }
    const matrices = this.state().data || [];
    const matrix = matrices.find(m => m.templateName == null || m.templateName === templateCode);
    return matrix != null && permissions.some(p => matrix[p as keyof AccessMatrix]);
  }

  hasAtLeastOnePermissionForAnyTemplate(permissions: string[]) {
    const matrices = this.state().data || [];
    return matrices.some(matrix => permissions.some(p => matrix[p as keyof AccessMatrix]));
  }
}
