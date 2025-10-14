import { Injectable } from '@angular/core';
import { BaseState } from '@reuse/code/states/helpers/base.state';
import { EncryptionService } from '@reuse/code/services/privacy/encryption.service';
import { LoadingStatus } from '@reuse/code/interfaces';

@Injectable({ providedIn: 'root' })
export class EncryptionState extends BaseState<CryptoKey> {
  constructor(private readonly encryptionService: EncryptionService) {
    super();
  }

  loadCryptoKey(unit8Array: Uint8Array): void {
    this.load(this.encryptionService.importKey(unit8Array));
  }

  resetCryptoKey() {
    this.reset();
  }

  setCryptoKeyError(error: Error) {
    this._state.set({
      status: LoadingStatus.ERROR,
      data: undefined,
      error: error as unknown as Record<keyof CryptoKey, unknown>,
    });
  }
}
