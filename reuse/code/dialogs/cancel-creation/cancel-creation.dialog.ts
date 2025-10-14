import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { NgFor } from '@angular/common';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { TemplateNamePipe } from '@reuse/code/pipes/template-name.pipe';
import { CreatePrescriptionForm } from '@reuse/code/interfaces';

export interface CancelCreationDialogData {
  prescriptionForms: CreatePrescriptionForm[];
}

export interface CancelCreationDialogResult {
  formsToDelete: number[];
}

@Component({
  templateUrl: './cancel-creation.dialog.html',
  styleUrls: ['./cancel-creation.dialog.scss'],
  imports: [TranslateModule, MatDialogModule, MatButtonModule, MatCheckboxModule, TemplateNamePipe, NgFor],
})
export class CancelCreationDialog {
  readonly prescriptionForms = this.data.prescriptionForms;
  formsToDelete: number[] = [];

  constructor(
    private readonly dialogRef: MatDialogRef<CancelCreationDialog, CancelCreationDialogResult>,
    @Inject(MAT_DIALOG_DATA) private readonly data: CancelCreationDialogData
  ) {}

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
    this.dialogRef.close({ formsToDelete: this.formsToDelete });
  }
}
