import { Injectable } from '@angular/core';
import { AbstractControl, AsyncValidator, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { PrescriptionModelService } from '@reuse/code/services/api/prescriptionModel.service';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export const nameValidatorWithOriginal = (
  nameValidator: UniqueModelNameValidator,
  originalName: () => string
): AsyncValidatorFn => (control: AbstractControl) => {
  if (!originalName() || control.value === originalName()) {
    return of(null);
  }
  return nameValidator.validate(control);
};

@Injectable({ providedIn: 'root' })
export class UniqueModelNameValidator implements AsyncValidator {
  constructor(private readonly prescriptionModelService: PrescriptionModelService) {}
  validate(control: AbstractControl): Observable<ValidationErrors | null> {
    return this.prescriptionModelService.getModelByName(control.value as string).pipe(
      map(prescriptionModelRequest => {
        return prescriptionModelRequest.empty ? null : { uniqueName: true };
      }),
      catchError(() => of(null))
    );
  }
}
