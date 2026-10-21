import { Component, computed, inject, WritableSignal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { PerformerTaskResource, ReadRequestResource, Role } from '@reuse/code/openapi';
import { FormTemplate } from '@smals-belgium-shared/vas-evaluation-form-ui-core';
import { EvfFormDetailsWebComponent } from '../../../evf-details/evf-form-details.component';
import { PrescriptionDetailsSecondaryService } from '../../services/prescription-details-secondary.service';
import { PrescriptionDetailsProfessionalListComponent } from '../professional-list/prescription-details-professional-list.component';
import { TemplateCodes, UserInfo } from '@reuse/code/interfaces';
import { MatButton } from '@angular/material/button';

@Component({
  selector: 'app-prescription-details-secondary',
  imports: [TranslatePipe, PrescriptionDetailsProfessionalListComponent, EvfFormDetailsWebComponent, MatButton],
  templateUrl: './prescription-details-secondary.component.html',
  styleUrl: './prescription-details-secondary.component.scss',
})
export class PrescriptionDetailsSecondaryComponent {
  private readonly _service = inject(PrescriptionDetailsSecondaryService);

  readonly isOrganization = this._service.isOrganization$;

  readonly prescriptionServiceData: ReadRequestResource | undefined = this._service.getPrescription().data;
  readonly decryptedResponses = computed(() => this._service.getDecryptedResponses('secondary'));
  readonly currentLang = this._service.currentLang;
  readonly templateVersion: FormTemplate | undefined = this._service.getTemplateVersion().data as FormTemplate;
  readonly isProfessional$ = this._service.isProfessional$;
  readonly currentUserServiceData: Partial<UserInfo> | undefined = this._service.getCurrentUser().data;
  readonly loading: WritableSignal<boolean> = this._service.loading;

  readonly canViewSecondaryDetails = computed(() => {
    const isPrescriber = this.isProfessional$() && this.currentUserServiceData?.role === Role.Prescriber;

    return (this.isOrganization() || isPrescriber) && !!this.decryptedResponses().data && !!this.templateVersion;
  });

  get performerTaskEntries(): [string, PerformerTaskResource[]][] {
    return Object.entries(this.prescriptionServiceData?.performerTasks ?? {});
  }

  onSelfAssign(prescription: ReadRequestResource, currentUser?: Partial<UserInfo>): void {
    this._service.onSelfAssign(prescription, currentUser);
  }

  protected readonly TemplateCodes = TemplateCodes;
}
