import { Component, inject, Input } from '@angular/core';
import { UserInfo } from '@reuse/code/interfaces';
import { PerformerTaskResource, PersonResource, ReadRequestResource } from '@reuse/code/openapi';
import { PrescriptionDetailsSecondaryService } from '../../prescription-details-secondary/prescription-details-secondary.service';
import { TranslatePipe } from '@ngx-translate/core';
import { CanTransferAssignationPipe } from '@reuse/code/pipes/can-transfer-assignation.pipe';
import { CanCancelTreatmentPipe } from '@reuse/code/pipes/can-cancel-treatment.pipe';
import { CanFinishTreatmentPipe } from '@reuse/code/pipes/can-finish-treatment.pipe';
import { CanStartTreatmentPipe } from '@reuse/code/pipes/can-start-treatment.pipe';
import { MatIconModule } from '@angular/material/icon';
import { CanInterruptTreatmentPipe } from '@reuse/code/pipes/can-interrupt-treatment.pipe';
import { CanRejectAssignationPipe } from '@reuse/code/pipes/can-reject-assignation.pipe';
import { CanRestartTreatmentPipe } from '@reuse/code/pipes/can-restart-treatment.pipe';
import { MatMenuItem } from '@angular/material/menu';

@Component({
  selector: 'app-task-button-group',
  imports: [
    TranslatePipe,
    MatIconModule,
    CanTransferAssignationPipe,
    CanCancelTreatmentPipe,
    CanFinishTreatmentPipe,
    CanStartTreatmentPipe,
    CanInterruptTreatmentPipe,
    CanRejectAssignationPipe,
    CanRestartTreatmentPipe,
    MatMenuItem,
  ],
  templateUrl: './task-button-group.component.html',
  standalone: true,
})
export class TaskButtonGroupComponent {
  @Input({ required: true }) currentPerformerTask!: PerformerTaskResource;

  protected readonly service = inject(PrescriptionDetailsSecondaryService);

  readonly prescriptionData: ReadRequestResource | undefined = this.service.getPrescription().data;
  readonly performerTaskData: PerformerTaskResource | undefined = this.service.getPerformerTask().data;
  readonly patientData: PersonResource | undefined = this.service.getPatient().data;
  readonly currentUserData: Partial<UserInfo> | undefined = this.service.getCurrentUser().data;
}
