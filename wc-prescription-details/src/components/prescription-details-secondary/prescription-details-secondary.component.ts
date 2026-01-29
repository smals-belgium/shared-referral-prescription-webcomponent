import { Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ReadRequestResource } from '@reuse/code/openapi';
import { PrescriptionDetailsOrganizationListComponent } from './prescription-details-organization-list/prescription-details-organization-list.component';
import { PrescriptionDetailsCaregiverListComponent } from './prescription-details-caregiver-list/prescription-details-caregiver-list.component';
import { PrescriptionDetailsSecondaryService } from './prescription-details-secondary.service';

@Component({
  selector: 'app-prescription-details-secondary',
  imports: [TranslatePipe, PrescriptionDetailsOrganizationListComponent, PrescriptionDetailsCaregiverListComponent],
  templateUrl: './prescription-details-secondary.component.html',
  styleUrl: './prescription-details-secondary.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  standalone: true,
})
export class PrescriptionDetailsSecondaryComponent {
  private readonly _service = inject(PrescriptionDetailsSecondaryService);

  readonly prescriptionServiceData: ReadRequestResource | undefined = this._service.getPrescription().data;
}
