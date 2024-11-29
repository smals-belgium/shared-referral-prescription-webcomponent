import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { NgIf } from '@angular/common';
import { TemplateNamePipe } from '../../pipes/template-name.pipe';
import { PerformerTask, Person, ReadPrescription } from '../../interfaces';
import { OverlaySpinnerComponent } from '../../components/overlay-spinner/overlay-spinner.component';
import { ToastService } from '../../services/toast.service';
import { PrescriptionState } from '../../states/prescription.state';
import { v4 as uuidv4 } from 'uuid';

interface CancelExecutionPrescriptionDialogData {
  prescription: ReadPrescription;
  performerTask: PerformerTask;
  patient: Person;
}

@Component({
  standalone: true,
  templateUrl: './cancel-execution-prescription.dialog.html',
  styleUrls: ['./cancel-execution-prescription.dialog.scss'],
  imports: [
    TranslateModule,
    MatDialogModule,
    MatButtonModule,
    OverlaySpinnerComponent,
    TemplateNamePipe,
    NgIf
  ]
})
export class CancelExecutionPrescriptionDialog implements OnInit {

  prescription: ReadPrescription;
  patient: Person;
  performerTask: PerformerTask;
  loading = false;
  generatedUUID = '';

  constructor(
    private prescriptionStateService: PrescriptionState,
    private toastService: ToastService,
    private dialogRef: MatDialogRef<CancelExecutionPrescriptionDialog>,
    @Inject(MAT_DIALOG_DATA) private data: CancelExecutionPrescriptionDialogData
  ) {
    this.prescription = data.prescription;
    this.patient = data.patient;
    this.performerTask = data.performerTask;
  }

  ngOnInit() {
    this.generatedUUID = uuidv4();
  }

  cancelPrescriptionExecution(): void {
    this.loading = true;
    this.prescriptionStateService
      .cancelPrescriptionExecution(this.prescription.id!, this.performerTask.id, this.generatedUUID)
      .subscribe({
        next: () => {
          this.toastService.show('prescription.cancelExecution.success');
          this.dialogRef.close(true);
        },
        error: () => {
          this.loading = false;
          this.toastService.showSomethingWentWrong();
        }
      });
  }
}
