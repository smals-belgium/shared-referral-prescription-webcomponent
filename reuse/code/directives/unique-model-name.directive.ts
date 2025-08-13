import { Injectable } from '@angular/core';
import { AbstractControl, AsyncValidator, ValidationErrors } from '@angular/forms';
import { PrescriptionModelService } from '../services/prescription-model.service';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({providedIn: 'root'})
export class UniqueModelNameValidator implements AsyncValidator {
  constructor(private readonly prescriptionModelService: PrescriptionModelService) {
  }
  validate(control: AbstractControl): Observable<ValidationErrors | null> {
    return this.prescriptionModelService.getModelByName(control.value).pipe(
      map((prescriptionModelRequest) => {
        return (prescriptionModelRequest.empty ? null : {uniqueName: true})
      }),
      catchError(() => of(null)),
    );
  }
}
