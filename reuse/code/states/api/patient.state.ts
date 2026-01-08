import { inject, Injectable } from '@angular/core';
import { PersonService } from '@reuse/code/services/api/person.service';
import { LoadingStatus } from '@reuse/code/interfaces';
import { BaseState } from '@reuse/code/states/helpers/base.state';
import { PersonResource } from '@reuse/code/openapi';

@Injectable({ providedIn: 'root' })
export class PatientState extends BaseState<PersonResource> {
  private personService = inject(PersonService);

  loadPatient(ssin: string): void {
    this.load(this.personService.findOne(ssin));
  }

  setPatient(patient: PersonResource): void {
    this._state.set({ status: LoadingStatus.SUCCESS, data: patient });
  }
}
