import { ChangeDetectionStrategy, Component, computed, inject, Signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { CanRejectAssignationPipe } from '@reuse/code/pipes/can-reject-assignation.pipe';
import { MatIconButton } from '@angular/material/button';
import { UserInfo } from '@reuse/code/interfaces';
import { FhirR4TaskStatus, ReadRequestResource, RequestTaskResource, Role } from '@reuse/code/openapi';
import { PrescriptionDetailsSecondaryService } from '../../services/prescription-details-secondary.service';
import { FormatNihdiPipe } from '@reuse/code/pipes/format-nihdi.pipe';
import { MatChip } from '@angular/material/chips';
import { mapDisplayStatusToColor, mapFhirTaskStatus } from '@reuse/code/utils/fhir-status-display-map.utils';
import { FormatMultilingualObjectPipe } from '@reuse/code/pipes/format-multilingual-object.pipe';
import {
  asOrganizationTask,
  asPerformerTask,
  getPerformerTaskFromOrganizationTask,
  isOrganizationTask,
  isPerformerTask,
  organizationTaskHasNoPerformerTask,
} from '@reuse/code/utils/task-type.util';
import { ALERT_TARGET } from '@reuse/code/constants/error';

@Component({
  selector: 'app-prescription-details-professional-list',
  imports: [
    TranslatePipe,
    MatIcon,
    MatTooltip,
    DatePipe,
    CanRejectAssignationPipe,
    MatIconButton,
    FormatNihdiPipe,
    MatChip,
    FormatMultilingualObjectPipe,
    NgTemplateOutlet,
  ],
  templateUrl: './prescription-details-professional-list.component.html',
  styleUrl: './prescription-details-professional-list.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrescriptionDetailsProfessionalListComponent {
  protected readonly service = inject(PrescriptionDetailsSecondaryService);
  protected readonly alertTarget = inject(ALERT_TARGET);

  protected readonly isPerformerTask = isPerformerTask;
  protected readonly asPerformerTask = asPerformerTask;
  protected readonly asOrganizationTask = asOrganizationTask;
  protected readonly isOrganizationTask = isOrganizationTask;
  protected readonly organizationTaskHasNoPerformerTask = organizationTaskHasNoPerformerTask;
  protected readonly getPerformerTaskFromOrganizationTask = getPerformerTaskFromOrganizationTask;

  readonly prescriptionServiceData: ReadRequestResource | undefined = this.service.getPrescription().data;
  readonly currentUserServiceData: Partial<UserInfo> | undefined = this.service.getCurrentUser().data;
  readonly performerTaskEntries: [string, RequestTaskResource[]][] = (() => {
    const entries = Object.entries(this.prescriptionServiceData?.performerTasks ?? {});
    const currentUser = this.currentUserServiceData;

    if (currentUser?.organizations) {
      const organizationEntry = Object.entries(currentUser.organizations[0])[0];
      const nihii = organizationEntry[1].nihii;
      const ssin = this.currentUserServiceData?.ssin;

      if (!nihii || !ssin) return entries;

      const key = `${nihii}:${ssin}`;
      type Entry = [string, RequestTaskResource[]];

      const compareEntries = ([a]: Entry, [b]: Entry) => {
        if (a === key) return -1;
        if (b === key) return 1;
        return 0;
      };

      return entries.sort(compareEntries);
    } else {
      return entries;
    }
  })();

  readonly patientServiceData = computed(() => this.service.getPatient().data);

  readonly currentLang: Signal<string> = this.service.currentLang;

  getReadableStatus(status?: FhirR4TaskStatus) {
    if (!status) return undefined;
    return mapFhirTaskStatus(status);
  }

  getStatusColor(status: FhirR4TaskStatus) {
    const mhColor = mapDisplayStatusToColor(status);
    return mhColor + ' mh-no-overlay';
  }

  formatString(description: string) {
    return description
      .split('\n')
      .map(x => x.replace(/^- /, '').trim())
      .filter(Boolean)
      .map(item => item.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'));
  }

  protected readonly Role = Role;
}
