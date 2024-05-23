import { Pipe } from '@angular/core';
import { AccessMatrixState } from '../states/access-matrix.state';

@Pipe({name: 'canCreatePrescription', standalone: true})
export class CanCreatePrescriptionPipe {

  constructor(
    private accessMatrixState: AccessMatrixState,
  ) {
  }

  transform(templateCode: string): boolean {
    return this.accessMatrixState.hasAtLeastOnePermission(['createPrescription'], templateCode);
  }
}
