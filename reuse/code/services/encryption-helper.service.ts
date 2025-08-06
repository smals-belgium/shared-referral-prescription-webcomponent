import { Injectable } from '@angular/core';
import { EncryptionService } from '@reuse/code/services/encryption.service';
import { EncryptionKeyInitializerService } from '@reuse/code/services/encryption-key-initializer.service';
import { Observable, of, switchMap, throwError } from 'rxjs';
import { EncryptionState } from '@reuse/code/states/encryption.state';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class EncryptionHelperService {

  constructor(
    private readonly encryptionService: EncryptionService,
    private readonly encryptionKeyInitializer: EncryptionKeyInitializerService,
    private readonly encryptionStateService: EncryptionState
  ) {
  }

  /**
   * encrypt a string with the existing cryptoKey, otherwise, generate a new one
   * @param reason the reason in clear text (can be empty) to be encrypted
   * @param pseudonymizedKey the existing pseudonymizedKey from existing proposal (if exists) or the new one generated
   */
  public getEncryptedReasonAndPseudoKey(reason?: string, pseudonymizedKey?: string): Observable<{
    encryptedText: string,
    pseudonymizedKey?: string
  } | null> {
    if (!reason) {
      return of(null);
    }

    const cryptoKey = this.encryptionStateService.state().data;

    if (cryptoKey) {
      return this.encryptionService.encryptText(cryptoKey, reason).pipe(
        map((encryptedText) => ({
          encryptedText: encryptedText,
          pseudonymizedKey: pseudonymizedKey
        })),
        catchError(() => {
          return throwError(() => new Error('Encryption issue'));
        })
      );
    } else {
      return this.encryptionKeyInitializer.initialize().pipe(
        map(() => this.encryptionKeyInitializer.getCryptoKey()),
        switchMap((generatedKey) => {
          if (!generatedKey) {
            return throwError(() => new Error('Encryption key generation failed'));
          }
          return this.encryptionService.encryptText(generatedKey, reason).pipe(
            map((encryptedText) => ({
              encryptedText: encryptedText,
              pseudonymizedKey: this.encryptionKeyInitializer.getPseudonymizedKey()
            }))
          );
        }),
        catchError(() => {
          return throwError(() => new Error('Encryption issue'));
        })
      );
    }
  }
}
