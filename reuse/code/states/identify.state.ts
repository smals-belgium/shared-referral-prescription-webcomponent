import { Injectable } from '@angular/core';
import { LoadingStatus, Person } from '../interfaces';
import { BaseState } from './base.state';
import {PseudoService} from "../services/pseudo.service";

@Injectable({providedIn: 'root'})
export class IdentifyState extends BaseState<Person> {

  constructor(
    private pseudoService: PseudoService
  ) {
    super();
  }

  loadSSIN(value: string): void {
    this.load(this.pseudoService.identify(value));
  }

  setSSIN(patient: Person): void {
    this._state.set({status: LoadingStatus.SUCCESS, data: patient});
  }
}
