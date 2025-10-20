import { Component, inject, Signal } from '@angular/core';
import { FormatMultilingualObjectPipe } from '@reuse/code/pipes/format-multilingual-object.pipe';
import { TranslatePipe } from '@ngx-translate/core';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';
import { DatePipe } from '@angular/common';
import { UserInfo } from '@reuse/code/interfaces';
import { PerformerTaskResource, ReadRequestResource } from '@reuse/code/openapi';
import { PrescriptionDetailsSecondaryService } from '../prescription-details-secondary.service';
import {
  PrescriptionButtonGroupComponent
} from '../prescription-button-group/prescription-button-group.component';
import { TaskButtonGroupComponent } from '../task-button-group/task-button-group.component';

@Component({
  selector: 'app-prescription-details-organization-list',
  imports: [
    FormatMultilingualObjectPipe,
    TranslatePipe,
    MatTooltip,
    MatIcon,
    DatePipe,
    PrescriptionButtonGroupComponent,
    TaskButtonGroupComponent,
  ],
  templateUrl: './prescription-details-organization-list.component.html',
  styleUrl: './prescription-details-organization-list.component.scss',
  standalone: true,
})
export class PrescriptionDetailsOrganizationListComponent {

  protected readonly _service = inject(PrescriptionDetailsSecondaryService);

  readonly prescriptionServiceData: ReadRequestResource | undefined = this._service.getPrescription().data;
  readonly currentUserServiceData: Partial<UserInfo> | undefined = this._service.getCurrentUser().data;
  readonly performerTaskServiceData: PerformerTaskResource | undefined = this._service.getPerformerTask().data;
  readonly currentLang: Signal<string> = this._service.currentLang;
}
