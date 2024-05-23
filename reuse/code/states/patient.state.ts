import { Injectable } from '@angular/core';
import { PersonService } from '../services/person.service';
import { LoadingStatus, Person } from '../interfaces';
import { BaseState } from './base.state';

@Injectable({providedIn: 'root'})
export class PatientState extends BaseState<Person> {

  constructor(
    private personService: PersonService
  ) {
    super();
  }

  loadPatient(ssin: string): void {
    this.load(this.personService.findOne(ssin));
  }

  setPatient(patient: Person): void {
    this._state.set({status: LoadingStatus.SUCCESS, data: patient});
  }
}
