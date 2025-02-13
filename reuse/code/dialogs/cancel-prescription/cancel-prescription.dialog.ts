import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { NgIf } from '@angular/common';
import { TemplateNamePipe } from '../../pipes/template-name.pipe';
import { Person, PrescriptionCancellation, ReadPrescription } from '../../interfaces';
import { OverlaySpinnerComponent } from '../../components/overlay-spinner/overlay-spinner.component';
import { ToastService } from '../../services/toast.service';
import { PrescriptionState } from '../../states/prescription.state';
import { v4 as uuidv4 } from 'uuid';
import { ErrorCardComponent } from '../../components/error-card/error-card.component';
import { BaseDialog } from '../base.dialog';

interface CancelPrescriptionDialogData {
  prescription: ReadPrescription;
  patient: Person;
}

@Component({
  standalone: true,
  templateUrl: './cancel-prescription.dialog.html',
  styleUrls: ['./cancel-prescription.dialog.scss'],
  imports: [
    TranslateModule,
    MatDialogModule,
    MatButtonModule,
    OverlaySpinnerComponent,
    TemplateNamePipe,
    NgIf,
    ErrorCardComponent
  ]
})
export class CancelPrescriptionDialog extends BaseDialog implements OnInit {

  readonly prescription: ReadPrescription;
  readonly patient: Person;
  loading = false;
  generatedUUID = '';

  constructor(
    private prescriptionStateService: PrescriptionState,
    private toastService: ToastService,
    dialogRef: MatDialogRef<CancelPrescriptionDialog>,
    @Inject(MAT_DIALOG_DATA) private data: CancelPrescriptionDialogData,
  ) {
    super(dialogRef)
    this.prescription = data.prescription;
    this.patient = data.patient;
  }

  ngOnInit() {
    this.generatedUUID = uuidv4();
  }

  cancelPrescription(): void {
    const cancellation = {
      reason: undefined,
    } as PrescriptionCancellation;

    this.loading = true;
    this.prescriptionStateService
      .cancelPrescription(this.prescription.id, cancellation, this.generatedUUID)
      .subscribe({
        next: () => {
          this.closeErrorCard();
          this.toastService.show('prescription.cancel.success');
          this.closeDialog(true);
        },
        error: (err) => {
          this.loading = false;
          this.showErrorCard('common.somethingWentWrong', err)
        },
      });
  }
}
