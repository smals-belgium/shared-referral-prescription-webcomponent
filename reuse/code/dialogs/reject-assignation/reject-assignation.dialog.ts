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

interface RejectAssignationDialogData {
  prescription: ReadPrescription;
  performerTask: PerformerTask;
  patient: Person;
}

@Component({
  standalone: true,
  templateUrl: './reject-assignation.dialog.html',
  styleUrls: ['./reject-assignation.dialog.scss'],
  imports: [
    TranslateModule,
    MatDialogModule,
    MatButtonModule,
    OverlaySpinnerComponent,
    TemplateNamePipe,
    NgIf
  ]
})
export class RejectAssignationDialog implements OnInit {

  readonly prescription: ReadPrescription;
  readonly patient: Person;
  readonly performerTask: PerformerTask;
  loading = false;
  generatedUUID = '';

  constructor(
    private prescriptionStateService: PrescriptionState,
    private toastService: ToastService,
    private dialogRef: MatDialogRef<RejectAssignationDialog>,
    @Inject(MAT_DIALOG_DATA) private data: RejectAssignationDialogData
  ) {
    this.prescription = data.prescription;
    this.patient = data.patient;
    this.performerTask = data.performerTask;
  }

  ngOnInit() {
    this.generatedUUID = uuidv4();
  }

  rejectAssignation(): void {
    this.loading = true;
    this.prescriptionStateService.rejectAssignation(this.prescription.id, this.performerTask.id, this.generatedUUID).subscribe({
      next: () => {
        this.toastService.show('prescription.rejectAssignation.success');
        this.dialogRef.close(true);
      },
      error: () => {
        this.loading = false;
        this.toastService.showSomethingWentWrong();
      }
    });
  }
}
