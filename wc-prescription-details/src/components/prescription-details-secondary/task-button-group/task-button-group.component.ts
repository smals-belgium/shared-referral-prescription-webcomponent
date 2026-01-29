import { Component, computed, inject } from '@angular/core';
import {CanInterruptTreatmentPipe} from '@reuse/code/pipes/can-interrupt-treatment.pipe';
import {CanRejectAssignationPipe} from '@reuse/code/pipes/can-reject-assignation.pipe';
import {CanRestartTreatmentPipe} from '@reuse/code/pipes/can-restart-treatment.pipe';
import {MatIcon} from '@angular/material/icon';
import {MatIconButton} from '@angular/material/button';
import {TranslatePipe} from '@ngx-translate/core';
import { PrescriptionDetailsSecondaryService } from '../prescription-details-secondary.service';
import { PerformerTaskResource, ReadRequestResource } from '@reuse/code/openapi';
import { UserInfo } from '@reuse/code/interfaces';

@Component({
  selector: 'app-task-button-group',
  imports: [
    CanInterruptTreatmentPipe,
    CanRejectAssignationPipe,
    CanRestartTreatmentPipe,
    MatIcon,
    MatIconButton,
    TranslatePipe,
  ],
  templateUrl: './task-button-group.component.html',
  standalone: true,
})
export class TaskButtonGroupComponent {
  protected readonly service = inject(PrescriptionDetailsSecondaryService);

  readonly prescriptionServiceData: ReadRequestResource | undefined = this.service.getPrescription().data;
  readonly performerTaskServiceData: PerformerTaskResource | undefined = this.service.getPerformerTask().data;
  readonly patientServiceData = computed(() => this.service.getPatient().data);
  readonly currentUserServiceData: Partial<UserInfo> | undefined = this.service.getCurrentUser().data;
}
