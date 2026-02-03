import { Component, inject, Signal } from '@angular/core';
import { FormatMultilingualObjectPipe } from '@reuse/code/pipes/format-multilingual-object.pipe';
import { TranslatePipe } from '@ngx-translate/core';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';
import { DatePipe } from '@angular/common';
import { UserInfo } from '@reuse/code/interfaces';
import { PersonResource, ReadRequestResource } from '@reuse/code/openapi';
import { PrescriptionDetailsSecondaryService } from '../prescription-details-secondary.service';
import { FormatNihdiPipe } from '@reuse/code/pipes/format-nihdi.pipe';
import { CanRejectAssignationPipe } from '@reuse/code/pipes/can-reject-assignation.pipe';
import { MatIconButton } from '@angular/material/button';

@Component({
  selector: 'app-prescription-details-organization-list',
  imports: [
    FormatMultilingualObjectPipe,
    TranslatePipe,
    MatTooltip,
    MatIcon,
    DatePipe,
    FormatNihdiPipe,
    CanRejectAssignationPipe,
    MatIconButton,
  ],
  templateUrl: './prescription-details-organization-list.component.html',
  styleUrl: './prescription-details-organization-list.component.scss',
  standalone: true,
})
export class PrescriptionDetailsOrganizationListComponent {
  protected readonly _service = inject(PrescriptionDetailsSecondaryService);

  readonly prescriptionServiceData: ReadRequestResource | undefined = this._service.getPrescription().data;
  readonly currentUserServiceData: Partial<UserInfo> | undefined = this._service.getCurrentUser().data;
  readonly patientData: PersonResource | undefined = this._service.getPatient().data;
  readonly currentLang: Signal<string> = this._service.currentLang;
}
