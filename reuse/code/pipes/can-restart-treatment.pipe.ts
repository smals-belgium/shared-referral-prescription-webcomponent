import { Pipe } from '@angular/core';
import { PerformerTask, ReadPrescription } from '../interfaces';
import { AccessMatrixState } from '../states/access-matrix.state';

@Pipe({name: 'canRestartTreatment', standalone: true})
export class CanRestartTreatmentPipe {

  constructor(private _accessMatrixState: AccessMatrixState) {
  }

  transform(_prescription: ReadPrescription, _task: PerformerTask, _currentUserSsin?: string): boolean {
    return false;
    //TODO: Uncomment following code when UHMEP BE accepts "Restart" action on "On Hold" PerformerTask
    /*
    if (currentUserSsin == undefined)
      return false;
    return task.careGiverSsin == currentUserSsin && this.accessMatrixState.hasAtLeastOnePermission(['executeTreatment'], prescription.templateCode)
      && task.status === TaskStatus.ONHOLD;*/
  }
}
