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

interface RejectAssignationDialogData {
  prescription: ReadPrescription;
  performerTask: PerformerTask;
  patient: Person;
}

@Component({
  standalone: true,
  templateUrl: './restart-execution-prescription.dialog.html',
  styleUrls: ['./restart-execution-prescription.dialog.scss'],
  imports: [
    TranslateModule,
    MatDialogModule,
    MatButtonModule,
    OverlaySpinnerComponent,
    TemplateNamePipe,
    NgIf
  ]
})
export class RestartExecutionPrescriptionDialog {

  readonly prescription: ReadPrescription;
  readonly patient: Person;
  readonly performerTask: PerformerTask;
  loading = false;

  constructor(
    private prescriptionStateService: PrescriptionState,
    private toastService: ToastService,
    private dialogRef: MatDialogRef<RestartExecutionPrescriptionDialog>,
    @Inject(MAT_DIALOG_DATA) private data: RejectAssignationDialogData,
  ) {
    this.prescription = data.prescription;
    this.patient = data.patient;
    this.performerTask = data.performerTask;
  }

  restartExecution(): void {
    this.loading = true;
    this.prescriptionStateService.restartExecution(this.prescription.id, this.performerTask.id).subscribe({
      next: () => {
        this.toastService.show('prescription.restartExecution.success');
        this.dialogRef.close(true);
      },
      error: () => {
        this.loading = false;
        this.toastService.showSomethingWentWrong();
      }
    });
  }
}
