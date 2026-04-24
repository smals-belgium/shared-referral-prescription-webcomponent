import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, Signal } from '@angular/core';
import { DatePipe } from '@reuse/code/pipes/date.pipe';
import { ProfessionalDisplayComponent } from '@reuse/code/components/professional-display/professional-display.component';
import { TranslatePipe } from '@ngx-translate/core';
import { DataState, UserInfo } from '@reuse/code/interfaces';
import { PersonResource, ReadRequestResource, RequestStatus } from '@reuse/code/openapi';
import {
  DetailsServices,
  PrescriptionDetailsSecondaryService,
} from '../prescription-details-secondary/prescription-details-secondary.service';
import { PrescriptionDetailsBeneficiaryComponent } from './prescription-details-beneficiary/prescription-details-beneficiary.component';
import { EvfFormDetailsWebComponent } from '../evf-details/evf-form-details.component';
import { FormElement, FormTemplate } from '@smals-belgium-shared/vas-evaluation-form-ui-core';
import { FormatNihdiPipe } from '@reuse/code/pipes/format-nihdi.pipe';
import { InfoDetailComponent } from '@reuse/code/evf/components/info/detail/info-detail.component';
import { MatChip } from '@angular/material/chips';
import { mapDisplayStatusToColor } from '@reuse/code/utils/request-status-display-map.utils';

@Component({
  selector: 'app-prescription-details-main',
  imports: [
    DatePipe,
    ProfessionalDisplayComponent,
    TranslatePipe,
    PrescriptionDetailsBeneficiaryComponent,
    EvfFormDetailsWebComponent,
    FormatNihdiPipe,
    InfoDetailComponent,
    MatChip,
  ],
  templateUrl: './prescription-details-main.component.html',
  styleUrl: './prescription-details-main.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  standalone: true,
})
export class PrescriptionDetailsMainComponent {
  private readonly _service = inject(PrescriptionDetailsSecondaryService);

  readonly services: DetailsServices = this._service.services;

  readonly prescription: ReadRequestResource | undefined = this._service.getPrescription().data;
  // Needs to be computed because the data might return a success but without the data in it
  // The computed allows dynamic fetch of that data when available
  readonly decryptedResponses: Signal<DataState<Record<string, unknown> | undefined>> = computed(() =>
    this._service.getDecryptedResponses()
  );
  readonly templateVersion: FormTemplate | undefined = this._service.getTemplateVersion().data as FormTemplate;
  readonly patient: Signal<PersonResource | undefined> = computed(() => this._service.getPatient().data);
  readonly currentUser: Partial<UserInfo> | undefined = this._service.getCurrentUser().data;
  readonly status: Signal<boolean> = this._service.pssStatus;
  readonly isProfessional$: Signal<boolean | undefined> = this._service.isProfessional$;
  readonly currentLang: Signal<string> = this._service.currentLang;

  get infoElements(): FormElement[] {
    return this.templateVersion?.elements?.filter(element => element.viewType === 'info') ?? [];
  }

  getStatusColor(status: RequestStatus) {
    const mhColor = mapDisplayStatusToColor(status);
    return mhColor + ' mh-no-overlay';
  }
}
