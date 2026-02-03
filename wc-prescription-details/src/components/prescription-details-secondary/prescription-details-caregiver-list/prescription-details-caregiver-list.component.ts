import { Component, computed, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { DatePipe } from '@angular/common';
import { CanRejectAssignationPipe } from '@reuse/code/pipes/can-reject-assignation.pipe';
import { MatIconButton } from '@angular/material/button';
import { UserInfo } from '@reuse/code/interfaces';
import { FhirR4TaskStatus, ReadRequestResource } from '@reuse/code/openapi';
import { PrescriptionDetailsSecondaryService } from '../prescription-details-secondary.service';
import { FormatNihdiPipe } from '@reuse/code/pipes/format-nihdi.pipe';
import { MatChip } from '@angular/material/chips';
import { mapDisplayStatusToColor, mapFhirTaskStatus } from '@reuse/code/utils/fhir-status-display-map.utils';

@Component({
  selector: 'app-prescription-details-caregiver-list',
  imports: [
    TranslatePipe,
    MatIcon,
    MatTooltip,
    DatePipe,
    CanRejectAssignationPipe,
    MatIconButton,
    FormatNihdiPipe,
    MatChip,
  ],
  templateUrl: './prescription-details-caregiver-list.component.html',
  styleUrl: './prescription-details-caregiver-list.component.scss',
  standalone: true,
})
export class PrescriptionDetailsCaregiverListComponent {
  protected readonly service = inject(PrescriptionDetailsSecondaryService);

  readonly prescriptionServiceData: ReadRequestResource | undefined = this.service.getPrescription().data;
  readonly patientServiceData = computed(() => this.service.getPatient().data);
  readonly currentUserServiceData: Partial<UserInfo> | undefined = this.service.getCurrentUser().data;

  getReadableStatus(status?: FhirR4TaskStatus) {
    if (!status) return undefined;
    return mapFhirTaskStatus(status);
  }

  getStatusColor(status: FhirR4TaskStatus) {
    return mapDisplayStatusToColor(status);
  }
}
