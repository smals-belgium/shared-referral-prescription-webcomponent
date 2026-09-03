import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PersonResource, ReadRequestResource, RequestTaskResource } from '@reuse/code/openapi';
import { PrescriptionDetailsSecondaryService } from '../../../prescription-details-secondary/services/prescription-details-secondary.service';
import { TranslatePipe } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuItem } from '@angular/material/menu';
import { asPerformerTask, checkAndConvertToPerformerTask, isPerformerTask } from '@reuse/code/utils/task-type.util';
import { isProfessional } from '@reuse/code/utils/assignment-disciplines.utils';
import { ALERT_TARGET } from '@reuse/code/constants/error';

@Component({
  selector: 'app-task-button-group',
  imports: [TranslatePipe, MatIconModule, MatMenuItem],
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
  protected readonly isProfessional = isProfessional;
  protected readonly isPerformerTask = isPerformerTask;
  protected readonly asPerformerTask = asPerformerTask;
  protected readonly checkAndConvertToPerformerTask = checkAndConvertToPerformerTask;
}
