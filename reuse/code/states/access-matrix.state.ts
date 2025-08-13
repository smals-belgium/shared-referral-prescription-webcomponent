import { Injectable } from '@angular/core';
import { AccessMatrix, Permissions } from '../interfaces';
import { BaseState } from './base.state';
import { Observable } from 'rxjs';
import { AccessMatrixService } from '../services/access-matrix.service';

@Injectable({providedIn: 'root'})
export class AccessMatrixState extends BaseState<AccessMatrix[]> {

  constructor(
    private readonly accessMatrixApiService: AccessMatrixService
  ) {
    super();
  }

  loadAccessMatrix(): Observable<AccessMatrix[]> {
    return this.load(this.accessMatrixApiService.findForConnectedUser());
  }

  hasAtLeastOnePermission(permissions: Permissions[], templateCode: string): boolean {
    const matrices = this.state().data ?? [];
    const matrix = matrices.find(m => m.templateName == null || m.templateName === templateCode);
    return matrix != null && permissions.some((p) => matrix[p as keyof AccessMatrix]);
  }

  hasAtLeastOnePermissionForAnyTemplate(permissions: string[]) {
    const matrices = this.state().data ?? [];
    return matrices.some(matrix => permissions.some((p) => matrix[p as keyof AccessMatrix]));
  }
}
