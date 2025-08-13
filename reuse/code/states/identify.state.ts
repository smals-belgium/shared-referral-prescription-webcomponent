import { Injectable } from '@angular/core';
import { LoadingStatus } from '../interfaces';
import { BaseState } from './base.state';
import { PseudoService } from "../services/pseudo.service";
import { from } from "rxjs";

@Injectable({providedIn: 'root'})
export class IdentifyState extends BaseState<string> {

  constructor(
    private readonly pseudoService: PseudoService
  ) {
    super();
  }

  loadSSIN(value: string): void {
    this.load(from(this.pseudoService.identify(value)));
  }

  setSSIN(SSIN: string): void {
    this._state.set({status: LoadingStatus.SUCCESS, data: SSIN});
  }
}
