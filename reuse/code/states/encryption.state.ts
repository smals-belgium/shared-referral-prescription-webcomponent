import { Injectable } from '@angular/core';
import { BaseState } from './base.state';
import { EncryptionService } from '../services/encryption.service';
import { LoadingStatus } from '../interfaces';

@Injectable({providedIn: 'root'})
export class EncryptionState extends BaseState<CryptoKey> {

  constructor(
    private readonly encryptionService: EncryptionService
  ) {
    super();
  }

  loadCryptoKey(unit8Array: Uint8Array): void {
    this.load(this.encryptionService.importKey(unit8Array));
  }

  resetCryptoKey() {
    this.reset()
  }

  setCryptoKeyError(error: Error) {
    this._state.set({
      status: LoadingStatus.ERROR,
      data: undefined,
      error: error
    });
  }
}
