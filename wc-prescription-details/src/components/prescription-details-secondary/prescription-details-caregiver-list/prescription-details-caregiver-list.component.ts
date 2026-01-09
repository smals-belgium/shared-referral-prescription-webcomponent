import { Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { DatePipe } from '@angular/common';
import { CanRejectAssignationPipe } from '@reuse/code/pipes/can-reject-assignation.pipe';
import { MatIconButton } from '@angular/material/button';
import { CanInterruptTreatmentPipe } from '@reuse/code/pipes/can-interrupt-treatment.pipe';
import { CanRestartTreatmentPipe } from '@reuse/code/pipes/can-restart-treatment.pipe';
import { UserInfo } from '@reuse/code/interfaces';
import { PerformerTaskResource, PersonResource, ReadRequestResource } from '@reuse/code/openapi';
import { PrescriptionDetailsSecondaryService } from '../prescription-details-secondary.service';
import { PrescriptionButtonGroupComponent } from '../prescription-button-group/prescription-button-group.component';
import { FormatNihdiPipe } from '@reuse/code/pipes/format-nihdi.pipe';

@Component({
  selector: 'app-prescription-details-caregiver-list',
  imports: [
    TranslatePipe,
    MatIcon,
    MatTooltip,
    DatePipe,
    CanRejectAssignationPipe,
    MatIconButton,
    CanInterruptTreatmentPipe,
    CanRestartTreatmentPipe,
    PrescriptionButtonGroupComponent,
    FormatNihdiPipe,
  ],
  templateUrl: './prescription-details-caregiver-list.component.html',
  styleUrl: './prescription-details-caregiver-list.component.scss',
  standalone: true,
})
export class PrescriptionDetailsCaregiverListComponent {
  protected readonly service = inject(PrescriptionDetailsSecondaryService);

  readonly prescriptionServiceData: ReadRequestResource | undefined = this.service.getPrescription().data;
  readonly patientServiceData: PersonResource | undefined = this.service.getPatient().data;
  readonly currentUserServiceData: Partial<UserInfo> | undefined = this.service.getCurrentUser().data;
  readonly performerTaskServiceData: PerformerTaskResource | undefined = this.service.getPerformerTask().data;
}
