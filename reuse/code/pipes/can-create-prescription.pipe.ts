import { Pipe, PipeTransform } from '@angular/core';
import { AccessMatrixState } from '@reuse/code/states/api/access-matrix.state';

@Pipe({ name: 'canCreatePrescription', standalone: true })
export class CanCreatePrescriptionPipe implements PipeTransform {
  constructor(private accessMatrixState: AccessMatrixState) {}

  transform(templateCode: string): boolean {
    return this.accessMatrixState.hasAtLeastOnePermission(['createPrescription'], templateCode);
  }
}
