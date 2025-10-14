import { firstValueFrom, of } from 'rxjs';
import { EncryptionService } from './encryption.service';

describe('EncryptionService', () => {
  let encryptionService: EncryptionService;

  beforeAll(() => {
    // Mock the crypto.subtle object
    const mockCryptoSubtle = {
      generateKey: jest.fn().mockResolvedValue({} as CryptoKey),
      exportKey: jest.fn().mockResolvedValue(new ArrayBuffer(16)),
      importKey: jest.fn().mockResolvedValue({} as CryptoKey),
      encrypt: jest.fn().mockResolvedValue(new ArrayBuffer(16)),
      decrypt: jest.fn().mockResolvedValue(new ArrayBuffer(16))
    };

    // Attach mock to window.crypto.subtle
    Object.defineProperty(global, 'crypto', {
      value: { subtle: mockCryptoSubtle },
      configurable: true
    });
  });

  beforeEach(() => {
    encryptionService = new EncryptionService();
  });

  it('should generate a key', async () => {
    const key = await encryptionService.generateKey();
    expect(window.crypto.subtle.generateKey).toHaveBeenCalledWith(
      {
        name: 'AES-GCM',
        length: 256
      },
      true,
      ['encrypt', 'decrypt']
    );
    expect(key).toBeDefined();
  });

  it('should export a key', async () => {
    const key = {} as CryptoKey;
    const exportedKey = await encryptionService.exportKey(key);
    expect(window.crypto.subtle.exportKey).toHaveBeenCalledWith('raw', key);
    expect(exportedKey).toBeInstanceOf(ArrayBuffer);
  });

  it('should import a key', async () => {
    const key = new Uint8Array([
      1, 2, 3, 4, 5, 6, 7, 8,
      9, 10, 11, 12, 13, 14, 15, 16,
      17, 18, 19, 20, 21, 22, 23, 24,
      25, 26, 27, 28, 29, 30, 31, 32]);
    const importedKey = await firstValueFrom(encryptionService.importKey(key));
    expect(window.crypto.subtle.importKey).toHaveBeenCalledWith(
      'raw',
      key,
      'AES-GCM',
      false,
      ['encrypt','decrypt']
    );
    expect(importedKey).toBeDefined();
  });

  it('should encrypt data', async () => {
    const key = {} as CryptoKey;
    const data = new ArrayBuffer(16);
    const encrypted = await firstValueFrom(encryptionService.encrypt(key, data));
    expect(window.crypto.subtle.encrypt).toHaveBeenCalledWith(
      {
        name: 'AES-GCM',
        iv: new Uint8Array(12).fill(0)
      },
      key,
      data
    );
    expect(encrypted).toBeInstanceOf(ArrayBuffer);
  });

  it('should decrypt data', async () => {
    const key = {} as CryptoKey;
    const data = new ArrayBuffer(16);
    const iv = new ArrayBuffer(12);
    const decryptMock = jest.spyOn(window.crypto.subtle, 'decrypt').mockResolvedValue(new ArrayBuffer(16)); // Mocking the decrypted output

    const decrypted = await firstValueFrom(encryptionService.decrypt(key, data, iv));

    expect(decryptMock).toHaveBeenCalledWith(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      data
    );

    expect(decrypted).toBeInstanceOf(ArrayBuffer);
    decryptMock.mockRestore();
  });

  it('should encrypt text', async () => {
    const key = {} as CryptoKey;
    const plaintext = 'Hello, world!';
    const spyEncrypt = jest.spyOn(encryptionService, 'encrypt').mockReturnValue(of(new ArrayBuffer(16)));

    const encryptedText = await firstValueFrom(encryptionService.encryptText(key, plaintext));
    expect(spyEncrypt).toHaveBeenCalled();
    expect(encryptedText).toBeDefined();
  });

  it('should decrypt text', async () => {
    const key = {} as CryptoKey;
    const encryptedText = 'exampleBase64String';
    const spyDecrypt = jest.spyOn(encryptionService, 'decrypt').mockReturnValue(of(new ArrayBuffer(16)));

    const decryptedText = await firstValueFrom(encryptionService.decryptText(encryptedText, key));
    expect(spyDecrypt).toHaveBeenCalled();
    expect(decryptedText).toBeDefined();
  });

  it('should convert ArrayBuffer to Base64', () => {
    const buffer = new Uint8Array([72, 101, 108, 108, 111]).buffer; // "Hello"
    const base64 = encryptionService.arrayBufferToBase64(buffer);
    expect(base64).toBe('SGVsbG8=');
  });

  it('should convert Base64 to ArrayBuffer', () => {
    const base64 = 'SGVsbG8='; // Base64 encoded "Hello"
    const expectedArrayBuffer = new Uint8Array([72, 101, 108, 108, 111]);
    const result = encryptionService.base64ToCipherText(base64);

    const resultArray = new Uint8Array(result);

    expect(resultArray).toEqual(expectedArrayBuffer);
  });
});
