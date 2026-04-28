import { Pipe, PipeTransform } from '@angular/core';
import { AccessMatrixState } from '@reuse/code/states/api/access-matrix.state';
import { FhirR4TaskStatus, PerformerTaskResource, ReadRequestResource, RequestStatus } from '@reuse/code/openapi';
import { isProposal } from '@reuse/code/utils/utils';

/**
 * This pipe determines whether a treatment can start.
 *
 * The intent needs to be order.
 * The status of the prescription can be DRAFT, OPEN, PENDING or IN_PROGRESS
 * The status of the performerTask can be READY, COMPLETED, CANCELLED OR ONHOLD
 * If treatmentValidityEndDate is present, the current date must be earlier than treatmentValidityEndDate.
 *
 * Example usage:
 * ```html
 * <button *ngIf="prescription | canStartTreatment:currentPerformerTask">Assign</button>
 * ```
 *
 * @pipe
 * @name CanStartTreatmentPipe
 */

@Pipe({ name: 'canStartTreatment', standalone: true })
export class CanStartTreatmentPipe implements PipeTransform {
  constructor(private readonly accessMatrixState: AccessMatrixState) {}

  transform(prescription: ReadRequestResource, task?: PerformerTaskResource): boolean {
    const allowedStatuses: RequestStatus[] = [
      RequestStatus.Draft,
      RequestStatus.Open,
      RequestStatus.Pending,
      RequestStatus.InProgress,
    ];

    const allowedTaskStatuses: FhirR4TaskStatus[] = [
      FhirR4TaskStatus.Ready,
      FhirR4TaskStatus.Completed,
      FhirR4TaskStatus.Cancelled,
      FhirR4TaskStatus.Onhold,
    ];

    const now = new Date();
    const endDate = prescription.treatmentValidityEndDate ? new Date(prescription.treatmentValidityEndDate) : false;

    return (
      !isProposal(prescription.intent) &&
      allowedStatuses.includes(prescription.status!) &&
      this.accessMatrixState.hasAtLeastOnePermission(['executeTreatment'], prescription.templateCode) &&
      (!endDate || endDate > now) &&
      (!task || (!!task.status && allowedTaskStatuses.includes(task.status)))
    );
  }
}
