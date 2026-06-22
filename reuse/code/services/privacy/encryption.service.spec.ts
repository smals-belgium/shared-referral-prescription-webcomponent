import { firstValueFrom } from 'rxjs';
import { EncryptionService } from './encryption.service';

describe('EncryptionService', () => {
  let service: EncryptionService;

  beforeEach(() => {
    service = new EncryptionService();
  });

  it('crypto check', async () => {
    const data = new Uint8Array([1, 2, 3]);

    expect(data instanceof Uint8Array).toBe(true);

    const key = await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt']
    );

    expect(key).toBeDefined();
  });

  describe('generateKey', () => {
    it('should generate AES-256 key', async () => {
      const key = await service.generateKey();

      expect(key).toBeDefined();
      expect(key.type).toBe('secret');
      expect(key.algorithm).toEqual(
        expect.objectContaining({
          name: 'AES-GCM',
          length: 256,
        })
      );
    });
  });

  describe('exportKey', () => {
    it('should export generated key', async () => {
      const key = await service.generateKey();

      const exported = await service.exportKey(key);

      expect(exported).toBeDefined();
      expect(exported.byteLength).toBe(32);
    });
  });

  describe('importKey', () => {
    it('should import exported key', async () => {
      const key = await service.generateKey();

      const exported = await service.exportKey(key);

      const imported = await firstValueFrom(service.importKey(new Uint8Array(exported)));

      expect(imported).toBeDefined();
      expect(imported.type).toBe('secret');
    });

    it('should reject invalid key length', () => {
      expect(() => service.importKey(new Uint8Array(16))).toThrow('Invalid key length: Expected 32 bytes for AES-256');
    });
  });

  describe('encrypt/decrypt', () => {
    it('should encrypt and decrypt bytes 2', async () => {
      const key = await service.generateKey();

      const plaintext = new TextEncoder().encode('Hello World');

      const encrypted = await firstValueFrom(service.encrypt(key, plaintext));

      expect(typeof encrypted).toBe('string');

      const decrypted = await firstValueFrom(service.decrypt(key, encrypted));

      expect(new TextDecoder().decode(decrypted)).toBe('Hello World');
    });
  });

  describe('encryptText/decryptText', () => {
    it('should encrypt and decrypt text', async () => {
      const key = await service.generateKey();

      const original = 'Hello World';

      const encrypted = await firstValueFrom(service.encryptText(key, original));

      expect(encrypted).toBeTruthy();

      const decrypted = await firstValueFrom(service.decryptText(encrypted, key));

      expect(decrypted).toBe(original);
    });

    it('should support unicode', async () => {
      const key = await service.generateKey();

      const original = 'Bonjour 👋 Français éèàçö';

      const encrypted = await firstValueFrom(service.encryptText(key, original));

      const decrypted = await firstValueFrom(service.decryptText(encrypted, key));

      expect(decrypted).toBe(original);
    });
  });

  describe('legacy decrypt', () => {
    it('should decrypt legacy AES-GCM payload', async () => {
      const key = await service.generateKey();

      const text = 'legacy text';

      const iv = new Uint8Array(12).fill(0);

      const encoded = new TextEncoder().encode(text);

      const encrypted = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv,
        },
        key,
        encoded
      );

      const merged = new Uint8Array(iv.length + encrypted.byteLength);

      merged.set(iv);
      merged.set(new Uint8Array(encrypted), iv.length);

      const base64 = service.arrayBufferToBase64(merged.buffer);

      const decrypted = await firstValueFrom(service.decryptText(base64, key));

      expect(decrypted).toBe(text);
    });
  });

  describe('base64 helpers', () => {
    it('should convert ArrayBuffer to Base64', () => {
      const buffer = new Uint8Array([72, 101, 108, 108, 111]).buffer;

      expect(service.arrayBufferToBase64(buffer)).toBe('SGVsbG8=');
    });

    it('should convert Base64 to Uint8Array', () => {
      const result = service.base64ToCipherText('SGVsbG8=');

      expect(Array.from(result)).toEqual([72, 101, 108, 108, 111]);
    });
  });
});
