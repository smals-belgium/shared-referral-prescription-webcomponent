import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { EncryptionService } from '@reuse/code/services/privacy/encryption.service';
import { PseudoService } from '@reuse/code/services/privacy/pseudo.service';

@Injectable({
  providedIn: 'root',
})
export class EncryptionKeyInitializerService {
  private cryptoKey?: CryptoKey;
  private pseudonymizedKey?: string;

  constructor(
    private readonly encryptionService: EncryptionService,
    private readonly pseudoService: PseudoService
  ) {}

  getCryptoKey(): CryptoKey | undefined {
    return this.cryptoKey;
  }

  getPseudonymizedKey(): string | undefined {
    return this.pseudonymizedKey;
  }

  initialize(): Observable<void> {
    return from(
      (async () => {
        try {
          this.cryptoKey = await this.encryptionService.generateKey();
          this.pseudonymizedKey = await this.pseudonymizeEncryptionKey();
        } catch (error) {
          console.error('Failed to initialize encryption key:', error);
          this.cryptoKey = undefined;
          this.pseudonymizedKey = undefined;
        }
      })()
    );
  }

  private async pseudonymizeEncryptionKey(): Promise<string | undefined> {
    if (!this.cryptoKey) return undefined;

    try {
      const exportedKey = await this.encryptionService.exportKey(this.cryptoKey);
      const byteArray = new Uint8Array(exportedKey);
      const byteArrToVal = this.pseudoService.byteArrayToValue(byteArray);
      if (byteArray && byteArrToVal !== null) {
        return this.pseudoService.pseudonymizeValue(byteArrToVal);
      } else {
        return undefined;
      }
    } catch (error) {
      console.error('Failed to pseudonymize encryption key:', error);
      return undefined;
    }
  }
}
