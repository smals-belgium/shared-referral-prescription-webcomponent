import { Pipe, PipeTransform } from '@angular/core';
import { AccessMatrixState } from '@reuse/code/states/api/access-matrix.state';
import { PerformerTaskResource, ReadRequestResource } from '@reuse/code/openapi';

@Pipe({ name: 'canRestartTreatment', standalone: true })
export class CanRestartTreatmentPipe implements PipeTransform {
  constructor(private _accessMatrixState: AccessMatrixState) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  transform(_prescription: ReadRequestResource, _task: PerformerTaskResource, _currentUserSsin?: string): boolean {
    return false;
    //TODO: Uncomment following code when UHMEP BE accepts "Restart" action on "On Hold" PerformerTask
    /*
    if (currentUserSsin == undefined)
      return false;
    return task.careGiverSsin == currentUserSsin && this.accessMatrixState.hasAtLeastOnePermission(['executeTreatment'], prescription.templateCode)
      && task.status === TaskStatus.ONHOLD;*/
  }
}
