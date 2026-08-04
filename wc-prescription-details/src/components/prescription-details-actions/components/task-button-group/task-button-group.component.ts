import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { UserInfo } from '@reuse/code/interfaces';
import { PersonResource, ReadRequestResource, RequestTaskResource } from '@reuse/code/openapi';
import { PrescriptionDetailsSecondaryService } from '../../../prescription-details-secondary/services/prescription-details-secondary.service';
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
import { asPerformerTask, checkAndConvertToPerformerTask, isPerformerTask } from '@reuse/code/utils/task-type.util';
import { isProfessional } from '@reuse/code/utils/assignment-disciplines.utils';
import { ALERT_TARGET } from '@reuse/code/constants/error';

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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskButtonGroupComponent {
  protected readonly service = inject(PrescriptionDetailsSecondaryService);
  protected readonly alertTarget = inject(ALERT_TARGET);

  readonly prescriptionData: ReadRequestResource | undefined = this.service.getPrescription().data;
  readonly requestTaskData: RequestTaskResource | undefined = this.service.getRequestTask().data;
  readonly patientData: PersonResource | undefined = this.service.getPatient().data;
  readonly currentUserData: Partial<UserInfo> | undefined = this.service.getCurrentUser().data;
  protected readonly isProfessional = isProfessional;
  protected readonly isPerformerTask = isPerformerTask;
  protected readonly asPerformerTask = asPerformerTask;
  protected readonly checkAndConvertToPerformerTask = checkAndConvertToPerformerTask;
}
