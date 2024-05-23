import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { NgFor } from '@angular/common';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import {
  CreatePrescriptionForm
} from '../../components/create-multiple-prescriptions/create-multiple-prescriptions.component';
import { TemplateNamePipe } from '../../pipes/template-name.pipe';

export interface CancelCreationDialogData {
  prescriptionForms: CreatePrescriptionForm[];
}

export interface CancelCreationDialogResult {
  formsToDelete: number[];
}

@Component({
  templateUrl: './cancel-creation.dialog.html',
  styleUrls: ['./cancel-creation.dialog.scss'],
  standalone: true,
  imports: [
    TranslateModule,
    MatDialogModule,
    MatButtonModule,
    MatCheckboxModule,
    TemplateNamePipe,
    NgFor
  ]
})
export class CancelCreationDialog {

  readonly prescriptionForms = this.data.prescriptionForms;
  formsToDelete: number[] = [];

  constructor(
    private dialogRef: MatDialogRef<CancelCreationDialog, CancelCreationDialogResult>,
    @Inject(MAT_DIALOG_DATA) private data: CancelCreationDialogData
  ) {
  }

  toggleDeleteForm(trackId: number) {
    if (this.formsToDelete.includes(trackId)) {
      this.formsToDelete = this.formsToDelete.filter(id => id !== trackId);
    } else {
      this.formsToDelete = [...this.formsToDelete, trackId];
    }
  }

  toggleDeleteAll(checked: boolean): void {
    if (checked) {
      this.formsToDelete = this.prescriptionForms.map(f => f.trackId);
    } else {
      this.formsToDelete = [];
    }
  }

  cancelPrescriptions(): void {
    this.dialogRef.close({formsToDelete: this.formsToDelete});
  }
}
