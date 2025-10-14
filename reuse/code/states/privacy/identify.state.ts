import { Injectable } from '@angular/core';
import { LoadingStatus } from '@reuse/code/interfaces';
import { BaseState } from '@reuse/code/states/helpers/base.state';
import { PseudoService } from '@reuse/code/services/privacy/pseudo.service';
import { from } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class IdentifyState extends BaseState<string> {
  constructor(private pseudoService: PseudoService) {
    super();
  }

  loadSSIN(value: string): void {
    this.load(from(this.pseudoService.identify(value)));
  }

  setSSIN(SSIN: string): void {
    this._state.set({ status: LoadingStatus.SUCCESS, data: SSIN });
  }
}
