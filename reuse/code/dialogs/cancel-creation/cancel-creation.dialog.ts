import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { TemplateNamePipe } from '@reuse/code/pipes/template-name.pipe';
import { CreatePrescriptionForm } from '@reuse/code/interfaces';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { MatError } from '@angular/material/form-field';
import { BaseDialog } from '@reuse/code/dialogs/base.dialog';
import { DialogLayoutComponent } from '@reuse/code/dialogs/dialog-layout/dialog-layout.component';

export interface CancelCreationDialogData {
  prescriptionForms: CreatePrescriptionForm[];
}

export interface CancelCreationDialogResult {
  formsToDelete: number[];
}

function atLeastOneSelected(group: AbstractControl): ValidationErrors | null {
  const hasChecked = Object.values((group as FormGroup).controls).some(c => c.value === true);
  return hasChecked ? null : { atLeastOneRequired: true };
}

@Component({
  templateUrl: './cancel-creation.dialog.html',
  styleUrls: ['./cancel-creation.dialog.scss'],
  imports: [
    TranslateModule,
    MatDialogModule,
    MatButtonModule,
    MatCheckboxModule,
    TemplateNamePipe,
    ReactiveFormsModule,
    MatError,
    DialogLayoutComponent,
  ],
})
export class CancelCreationDialog extends BaseDialog<CancelCreationDialog> {
  readonly prescriptionForms = this.data.prescriptionForms;

  readonly checkboxesGroup = new FormGroup(
    Object.fromEntries(this.prescriptionForms.map(f => [String(f.trackId), new FormControl(false)])),
    { validators: atLeastOneSelected }
  );

  constructor(
    dialogRef: MatDialogRef<CancelCreationDialog, CancelCreationDialogResult>,
    @Inject(MAT_DIALOG_DATA) private readonly data: CancelCreationDialogData
  ) {
    super(dialogRef);
  }

  get formsToDelete(): number[] {
    return Object.entries(this.checkboxesGroup.controls)
      .filter(([, c]) => c.value === true)
      .map(([id]) => +id);
  }

  toggleDeleteForm(trackId: number, checked: boolean): void {
    this.checkboxesGroup.get(String(trackId))?.setValue(checked);
  }

  selectAll(): void {
    const values = Object.fromEntries(Object.keys(this.checkboxesGroup.controls).map(key => [key, true]));
    this.checkboxesGroup.patchValue(values);
  }

  deselectAll(): void {
    const values = Object.fromEntries(Object.keys(this.checkboxesGroup.controls).map(key => [key, false]));
    this.checkboxesGroup.patchValue(values);
  }

  cancelPrescriptions(): void {
    this.checkboxesGroup.markAllAsTouched();
    if (this.checkboxesGroup.invalid) return;
    this.closeDialog({ formsToDelete: this.formsToDelete });
  }
}
