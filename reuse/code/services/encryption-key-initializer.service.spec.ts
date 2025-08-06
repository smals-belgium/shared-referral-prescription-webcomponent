import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { EncryptionKeyInitializerService } from './encryption-key-initializer.service';
import { EncryptionService } from '@reuse/code/services/encryption.service';
import { PseudoService } from '@reuse/code/services/pseudo.service';

const mockEncryptionService = {
  generateKey: jest.fn(),
  exportKey: jest.fn(),
};

const mockPseudoService = {
  byteArrayToValue: jest.fn(),
  pseudonymizeValue: jest.fn(),
};

describe('EncryptionKeyInitializerService', () => {
  let service: EncryptionKeyInitializerService;

  const mockCryptoKey = { type: 'secret' } as CryptoKey;
  const mockExportedKey = new ArrayBuffer(8);
  const mockNumericValue = 12345;
  const mockPseudonym = 'pseudonymized-string-abc';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        EncryptionKeyInitializerService,
        { provide: EncryptionService, useValue: mockEncryptionService },
        { provide: PseudoService, useValue: mockPseudoService },
      ],
    });
    service = TestBed.inject(EncryptionKeyInitializerService);

    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have undefined keys before initialization', () => {
    expect(service.getCryptoKey()).toBeUndefined();
    expect(service.getPseudonymizedKey()).toBeUndefined();
  });

  describe('initialize', () => {
    it('should successfully generate and pseudonymize a key', async () => {
      mockEncryptionService.generateKey.mockResolvedValue(mockCryptoKey);
      mockEncryptionService.exportKey.mockResolvedValue(mockExportedKey);
      mockPseudoService.byteArrayToValue.mockReturnValue(mockNumericValue);
      mockPseudoService.pseudonymizeValue.mockReturnValue(mockPseudonym);

      await firstValueFrom(service.initialize());

      expect(service.getCryptoKey()).toBe(mockCryptoKey);
      expect(service.getPseudonymizedKey()).toBe(mockPseudonym);

      expect(mockEncryptionService.generateKey).toHaveBeenCalledTimes(1);
      expect(mockEncryptionService.exportKey).toHaveBeenCalledWith(mockCryptoKey);
      expect(mockPseudoService.byteArrayToValue).toHaveBeenCalledWith(new Uint8Array(mockExportedKey));
      expect(mockPseudoService.pseudonymizeValue).toHaveBeenCalledWith(mockNumericValue);
      expect(console.error).not.toHaveBeenCalled();
    });

    it('should handle failure during key generation', async () => {
      const generationError = new Error('Key generation failed');
      mockEncryptionService.generateKey.mockRejectedValue(generationError);

      await firstValueFrom(service.initialize());

      expect(service.getCryptoKey()).toBeUndefined();
      expect(service.getPseudonymizedKey()).toBeUndefined();

      expect(console.error).toHaveBeenCalledWith('Failed to initialize encryption key:', generationError);

      expect(mockEncryptionService.exportKey).not.toHaveBeenCalled();
    });

    it('should handle failure during key export', async () => {
      const exportError = new Error('Key export failed');
      mockEncryptionService.generateKey.mockResolvedValue(mockCryptoKey);
      mockEncryptionService.exportKey.mockRejectedValue(exportError);

      await firstValueFrom(service.initialize());

      expect(service.getCryptoKey()).toBe(mockCryptoKey);
      expect(service.getPseudonymizedKey()).toBeUndefined();

      expect(console.error).toHaveBeenCalledWith('Failed to pseudonymize encryption key:', exportError);
    });

    it('should result in an undefined pseudonymized key if byteArrayToValue returns null', async () => {
      mockEncryptionService.generateKey.mockResolvedValue(mockCryptoKey);
      mockEncryptionService.exportKey.mockResolvedValue(mockExportedKey);
      mockPseudoService.byteArrayToValue.mockReturnValue(null);

      await firstValueFrom(service.initialize());

      expect(service.getCryptoKey()).toBe(mockCryptoKey);
      expect(service.getPseudonymizedKey()).toBeUndefined();

      expect(mockPseudoService.pseudonymizeValue).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
    });
  });
});
