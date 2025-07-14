import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';


@Injectable({
  providedIn: 'root',
})
export class EncryptionService {
  private IvLength = 12;
  private iv = new Uint8Array(this.IvLength).fill(0);

  generateKey() {
    return window.crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  async exportKey(key: CryptoKey) {
    return crypto.subtle
        .exportKey('raw', key)
  }

  importKey(key: Uint8Array) {
    if (key.length !== 32) {
      throw new Error("Invalid key length: Expected 32 bytes for AES-256");
    }

    return from(window.crypto.subtle.importKey(
      "raw",
      key,
      "AES-GCM",
      false,
      ["decrypt"]
    )
  );
  }

  encrypt(key: CryptoKey, value: ArrayBuffer) {
    return from(
      window.crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: this.iv,
        },
        key,
        value
      )
    );
  }

  decrypt(cryptoKey: CryptoKey, ciphertext: ArrayBuffer, iv: ArrayBuffer) {
    return from(
      window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        cryptoKey,
        ciphertext
      )
    );
  }

  encryptText(key: CryptoKey, plaintext: string): Observable<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);

    const unit8Array = this.iv;


  return this.encrypt(key, data)
      .pipe(
        map((encrypted) => {
          const encryptedDataArray = new Uint8Array(encrypted);
          const combinedData = new Uint8Array(this.IvLength + encryptedDataArray.length);
          combinedData.set(unit8Array);
          combinedData.set(encryptedDataArray, unit8Array.length);

          return this.arrayBufferToBase64(combinedData.buffer);
        })
      );

  }

  decryptText(encryptedText: string, cryptoKey: CryptoKey): Observable<string> {
    const ciphertextArray = this.base64ToCipherText(encryptedText);
    const iv = ciphertextArray.slice(0, this.IvLength); // First 12 bytes are IV
    const ciphertext = ciphertextArray.slice(this.IvLength); // Remaining bytes are ciphertext


    return this.decrypt(cryptoKey, ciphertext, iv).pipe(
      map((decrypted) => {
        const decoder = new TextDecoder();
        return decoder.decode(decrypted);
      })
    )
  }

  arrayBufferToBase64(buffer: ArrayBuffer): string {
    const uint8Array = new Uint8Array(buffer);
    let binary = '';
    uint8Array.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return window.btoa(binary);
  }

  base64ToCipherText(base64: string): ArrayBuffer {
    const binaryCiphertext = window.atob(base64);
    const ciphertextArray = new Uint8Array(binaryCiphertext.length);
    for (let i = 0; i < binaryCiphertext.length; i++) {
      ciphertextArray[i] = binaryCiphertext.charCodeAt(i);
    }

    return ciphertextArray;
  }
}
