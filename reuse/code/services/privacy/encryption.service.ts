import { Injectable } from '@angular/core';
import { from, Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { CompactEncrypt, compactDecrypt } from 'jose';

@Injectable({
  providedIn: 'root',
})
export class EncryptionService {
  generateKey() {
    return globalThis.crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  exportKey(key: CryptoKey) {
    return globalThis.crypto.subtle.exportKey('raw', key);
  }

  importKey(key: Uint8Array<ArrayBuffer>) {
    if (key.length !== 32) {
      throw new Error('Invalid key length: Expected 32 bytes for AES-256');
    }

    return from(globalThis.crypto.subtle.importKey('raw', key, 'AES-GCM', false, ['encrypt', 'decrypt']));
  }

  encrypt(key: CryptoKey, value: Uint8Array): Observable<string> {
    return from(
      new CompactEncrypt(Uint8Array.from(value))
        .setProtectedHeader({
          alg: 'dir',
          enc: 'A256GCM',
        })
        .encrypt(key)
    );
  }

  decrypt(cryptoKey: CryptoKey, encrypted: string): Observable<Uint8Array> {
    return from(compactDecrypt(encrypted, cryptoKey)).pipe(
      map(({ plaintext }) => Uint8Array.from(plaintext)),
      catchError(() => this.tryDecryptLegacy(cryptoKey, encrypted).pipe(map(buffer => new Uint8Array(buffer))))
    );
  }

  private tryDecryptLegacy(cryptoKey: CryptoKey, encrypted: string): Observable<ArrayBuffer> {
    let ciphertextArray: Uint8Array;

    try {
      ciphertextArray = this.base64ToCipherText(encrypted);
    } catch (e) {
      return throwError(() => new Error('Invalid encrypted payload: ' + e));
    }

    const ivLength = 12;
    const iv = ciphertextArray.slice(0, ivLength);
    const ciphertext = ciphertextArray.slice(ivLength);

    return this.decryptLegacy(cryptoKey, ciphertext, iv);
  }

  decryptLegacy(
    cryptoKey: CryptoKey,
    ciphertext: Uint8Array<ArrayBuffer>,
    iv: Uint8Array<ArrayBuffer>
  ): Observable<ArrayBuffer> {
    return from(
      globalThis.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv,
        },
        cryptoKey,
        ciphertext
      )
    );
  }

  encryptText(key: CryptoKey, plaintext: string): Observable<string> {
    const encoded = new TextEncoder().encode(plaintext);

    return this.encrypt(key, encoded);
  }

  decryptText(encryptedText: string, cryptoKey: CryptoKey): Observable<string> {
    return this.decrypt(cryptoKey, encryptedText).pipe(map(decrypted => new TextDecoder().decode(decrypted)));
  }

  arrayBufferToBase64(buffer: ArrayBuffer): string {
    const uint8Array = new Uint8Array(buffer);

    let binary = '';

    uint8Array.forEach(byte => {
      binary += String.fromCharCode(byte);
    });

    return globalThis.btoa(binary);
  }

  base64ToCipherText(base64: string): Uint8Array {
    const binaryCiphertext = globalThis.atob(base64);

    const ciphertextArray = new Uint8Array(binaryCiphertext.length);

    for (let i = 0; i < binaryCiphertext.length; i++) {
      ciphertextArray[i] = binaryCiphertext.charCodeAt(i);
    }

    return ciphertextArray;
  }
}
