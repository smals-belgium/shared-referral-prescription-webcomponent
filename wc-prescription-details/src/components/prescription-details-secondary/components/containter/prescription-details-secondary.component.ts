import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { PerformerTaskResource, ReadRequestResource } from '@reuse/code/openapi';
import { PrescriptionDetailsProfessionalListComponent } from '../professional-list/prescription-details-professional-list.component';
import { PrescriptionDetailsSecondaryService } from '../../services/prescription-details-secondary.service';

@Component({
  selector: 'app-prescription-details-secondary',
  imports: [TranslatePipe, PrescriptionDetailsProfessionalListComponent],
  templateUrl: './prescription-details-secondary.component.html',
  styleUrl: './prescription-details-secondary.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrescriptionDetailsSecondaryComponent {
  private readonly _service = inject(PrescriptionDetailsSecondaryService);

  readonly prescriptionServiceData: ReadRequestResource | undefined = this._service.getPrescription().data;

  get performerTaskEntries(): [string, PerformerTaskResource[]][] {
    return Object.entries(this.prescriptionServiceData?.performerTasks ?? {});
  }
}
