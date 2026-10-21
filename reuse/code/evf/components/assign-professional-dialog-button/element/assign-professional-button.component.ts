import { Component, inject, signal, WritableSignal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { MatButton } from '@angular/material/button';
import { AssignCareGiverResource, HealthcareProResource, ProviderType } from '@reuse/code/openapi';
import { MatDialog } from '@angular/material/dialog';
import { AssignOrTransferDialog } from '@reuse/code/dialogs/assign-or-transfer-dialog/assign-or-transfer-dialog';
import { FormatNihdiPipe } from '@reuse/code/pipes/format-nihdi.pipe';
import { EvfBaseFormElementComponent } from '@smals-belgium-shared/vas-evaluation-form-ui-material/elements/shared';
import { MatIcon } from '@angular/material/icon';
import { Intent } from '@reuse/code/interfaces';

@Component({
  selector: 'evf-assign-professional-button',
  imports: [TranslatePipe, MatButton, FormatNihdiPipe, MatIcon],
  templateUrl: './assign-professional-button.component.html',
  styleUrl: './assign-professional-button.component.scss',
})
export class AssignProfessionalButtonComponent extends EvfBaseFormElementComponent {
  private readonly _dialog = inject(MatDialog);

  private static counter = 0;
  readonly id = 'evf-assign-professional-button-' + AssignProfessionalButtonComponent.counter++;

  readonly selectedProfessional: WritableSignal<HealthcareProResource | undefined> = signal<
    HealthcareProResource | undefined
  >(undefined);

  openAssignProfessionalDialog(): void {
    this._dialog
      .open(AssignOrTransferDialog, {
        data: {
          mode: 'assign',
          category: 'nursing',
          intent: Intent.PROPOSAL,
          providerTypeFilter: [ProviderType.Professional],
        },
        panelClass: ['mh-dialog-container', 'mh-assign-dialog'],
        maxHeight: '90vh',
        maxWidth: '90vw',
        width: '900px',
      })
      .beforeClosed()
      .subscribe((professional: HealthcareProResource) => {
        this.selectedProfessional.set(professional);
        if (professional.healthcarePerson?.ssin && professional.healthcareQualification?.id?.profession) {
          const professionalToAssign: AssignCareGiverResource = {
            ssin: professional.healthcarePerson?.ssin,
            role: professional.healthcareQualification?.id?.profession,
          };
          this.control.setValue(professionalToAssign);
        }
      });
  }
  removeSelectedProfessional() {
    this.selectedProfessional.set(undefined);
    this.control.setValue(undefined);
  }
}
