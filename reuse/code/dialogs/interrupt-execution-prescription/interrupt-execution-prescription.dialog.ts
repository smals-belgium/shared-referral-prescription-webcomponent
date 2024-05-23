import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { NgIf } from '@angular/common';
import { TemplateNamePipe } from '../../pipes/template-name.pipe';
import { PerformerTask, Person, ReadPrescription } from '../../interfaces';
import { OverlaySpinnerComponent } from '../../components/overlay-spinner/overlay-spinner.component';
import { ToastService } from '../../services/toast.service';
import { PrescriptionState } from '../../states/prescription.state';

interface InterruptExecutionPrescriptionDialogData {
  prescription: ReadPrescription;
  performerTask: PerformerTask;
  patient: Person;
}

@Component({
  standalone: true,
  templateUrl: './interrupt-execution-prescription.dialog.html',
  styleUrls: ['./interrupt-execution-prescription.dialog.scss'],
  imports: [
    TranslateModule,
    MatDialogModule,
    MatButtonModule,
    OverlaySpinnerComponent,
    TemplateNamePipe,
    NgIf
  ]
})
export class InterruptExecutionPrescriptionDialog {

  prescription: ReadPrescription;
  performerTask: PerformerTask;
  patient: Person;
  loading = false;

  constructor(
    private prescriptionStateService: PrescriptionState,
    private toastService: ToastService,
    private dialogRef: MatDialogRef<InterruptExecutionPrescriptionDialog>,
    @Inject(MAT_DIALOG_DATA) private data: InterruptExecutionPrescriptionDialogData
  ) {
    this.prescription = data.prescription;
    this.patient = data.patient;
    this.performerTask = data.performerTask;
  }

  interruptPrescriptionExecution(): void {
    this.loading = true;
    this.prescriptionStateService
      .interruptPrescriptionExecution(this.prescription.id!, this.performerTask.id)
      .subscribe({
        next: () => {
          this.toastService.show('prescription.interruptExecution.success');
          this.dialogRef.close(true);
        },
        error: () => {
          this.loading = false;
          this.toastService.showSomethingWentWrong();
        }
      });
  }
}
