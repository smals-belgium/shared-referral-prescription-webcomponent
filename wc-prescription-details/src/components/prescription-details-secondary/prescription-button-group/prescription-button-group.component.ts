import { Component, inject, Input } from '@angular/core';
import { UserInfo } from '@reuse/code/interfaces';
import { PerformerTaskResource, PersonResource, ReadRequestResource } from '@reuse/code/openapi';
import { PrescriptionDetailsSecondaryService } from '../prescription-details-secondary.service';
import { TranslatePipe } from '@ngx-translate/core';
import { MatButton } from '@angular/material/button';
import { CanTransferAssignationPipe } from '@reuse/code/pipes/can-transfer-assignation.pipe';
import { CanCancelTreatmentPipe } from '@reuse/code/pipes/can-cancel-treatment.pipe';
import { CanFinishTreatmentPipe } from '@reuse/code/pipes/can-finish-treatment.pipe';
import { CanStartTreatmentPipe } from '@reuse/code/pipes/can-start-treatment.pipe';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-prescription-button-group',
  imports: [
    TranslatePipe,
    MatButton,
    MatIconModule,
    CanTransferAssignationPipe,
    CanCancelTreatmentPipe,
    CanFinishTreatmentPipe,
    CanStartTreatmentPipe,
  ],
  templateUrl: './prescription-button-group.component.html',
  styleUrl: './prescription-button-group.component.scss',
  standalone: true,
})
export class PrescriptionButtonGroupComponent {
  @Input({ required: true }) currentPerformerTask!: PerformerTaskResource;

  protected readonly service = inject(PrescriptionDetailsSecondaryService);

  readonly prescriptionData: ReadRequestResource | undefined = this.service.getPrescription().data;
  readonly performerTaskData: PerformerTaskResource | undefined = this.service.getPerformerTask().data;
  readonly patientData: PersonResource | undefined = this.service.getPatient().data;
  readonly currentUserData: Partial<UserInfo> | undefined = this.service.getCurrentUser().data;
}
