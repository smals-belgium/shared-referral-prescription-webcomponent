import { TestBed } from '@angular/core/testing';

import { EncryptionHelperService } from './encryption-helper.service';
import { EncryptionService } from '@reuse/code/services/privacy/encryption.service';
import { EncryptionKeyInitializerService } from '@reuse/code/states/privacy/encryption-key-initializer.service';
import { EncryptionState } from '@reuse/code/states/privacy/encryption.state';
import { firstValueFrom, of, throwError } from 'rxjs';

describe('EncryptionHelperService', () => {
  const mockEncryptionService = {
    encryptText: jest.fn(),
  };

  const mockEncryptionKeyInitializer = {
    initialize: jest.fn(),
    getCryptoKey: jest.fn(),
    getPseudonymizedKey: jest.fn(),
  };

  const mockEncryptionState = {
    state: jest.fn(),
  };

  describe('EncryptionHelperService', () => {
    let service: EncryptionHelperService;

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          EncryptionHelperService,
          { provide: EncryptionService, useValue: mockEncryptionService },
          { provide: EncryptionKeyInitializerService, useValue: mockEncryptionKeyInitializer },
          { provide: EncryptionState, useValue: mockEncryptionState },
        ],
      });
      service = TestBed.inject(EncryptionHelperService);

      jest.spyOn(console, 'error').mockImplementation(() => {});

      jest.clearAllMocks();
    });

    it('Should be created', () => {
      expect(service).toBeTruthy();
    });

    describe('getEncryptedReasonAndPseudoKey', () => {
      it('Should return of(null) if empty reason', async () => {
        const result = await firstValueFrom(service.getEncryptedReasonAndPseudoKey(''));
        expect(result).toBeNull();
      });

      it('Should return of(null) if reason is null', async () => {
        const result = await firstValueFrom(service.getEncryptedReasonAndPseudoKey(null as any));
        expect(result).toBeNull();
      });

      describe('reuse existing crypto key', () => {
        const mockCryptoKey = {} as CryptoKey;

        beforeEach(() => {
          mockEncryptionState.state.mockReturnValue({ data: mockCryptoKey });
        });

        it('Should encrypt note without generation of new pseudonymizedKey', async () => {
          const reason = 'reason';
          const encryptedText = 'text-tst-123';

          mockEncryptionService.encryptText.mockReturnValue(of(encryptedText));
          const result = await firstValueFrom(service.getEncryptedReasonAndPseudoKey(reason));

          expect(result).toEqual({
            encryptedText: encryptedText,
            pseudonymizedKey: undefined,
          });

          expect(mockEncryptionService.encryptText).toHaveBeenCalledWith(mockCryptoKey, reason);
          expect(mockEncryptionKeyInitializer.initialize).not.toHaveBeenCalled();
        });

        it('should handle encryption error and return of(null)', async () => {
          const reason = 'secret';
          const error = new Error('Encryption error');

          mockEncryptionService.encryptText.mockReturnValue(throwError(() => error));

          await expect(firstValueFrom(service.getEncryptedReasonAndPseudoKey(reason))).rejects.toThrow(
            'Encryption issue'
          );
        });
      });

      describe('without existing crypto key', () => {
        beforeEach(() => {
          mockEncryptionState.state.mockReturnValue({ data: null });
        });

        it('Should generate cryptoKey, encrypt note and return both', async () => {
          const reason = 'secret';
          const newCryptoKey = { type: 'secret' } as CryptoKey;
          const pseudonymizedKey = 'cle-pseudo-abc';
          const encryptedText = 'text-tst-456';

          mockEncryptionKeyInitializer.initialize.mockReturnValue(of(undefined));
          mockEncryptionKeyInitializer.getCryptoKey.mockReturnValue(newCryptoKey);
          mockEncryptionKeyInitializer.getPseudonymizedKey.mockReturnValue(pseudonymizedKey);
          mockEncryptionService.encryptText.mockReturnValue(of(encryptedText));

          const result = await firstValueFrom(service.getEncryptedReasonAndPseudoKey(reason));

          expect(result).toEqual({
            encryptedText: encryptedText,
            pseudonymizedKey: pseudonymizedKey,
          });
          expect(mockEncryptionKeyInitializer.initialize).toHaveBeenCalled();
          expect(mockEncryptionKeyInitializer.getCryptoKey).toHaveBeenCalled();
          expect(mockEncryptionService.encryptText).toHaveBeenCalledWith(newCryptoKey, reason);
          expect(mockEncryptionKeyInitializer.getPseudonymizedKey).toHaveBeenCalled();
        });

        it('should return of(null) if generation of key failed', async () => {
          const reason = 'reason';

          mockEncryptionKeyInitializer.initialize.mockReturnValue(of(undefined));
          mockEncryptionKeyInitializer.getCryptoKey.mockReturnValue(null);

          await expect(firstValueFrom(service.getEncryptedReasonAndPseudoKey(reason))).rejects.toThrow(
            'Encryption issue'
          );

          expect(mockEncryptionService.encryptText).not.toHaveBeenCalled();
        });

        it('should throw error when key generation fails', async () => {
          const reason = 'Secret final';
          const error = new Error('init crypto key error');

          mockEncryptionKeyInitializer.initialize.mockReturnValue(throwError(() => error));

          await expect(firstValueFrom(service.getEncryptedReasonAndPseudoKey(reason))).rejects.toThrow(
            'Encryption issue'
          );

          expect(mockEncryptionService.encryptText).not.toHaveBeenCalled();
        });
      });
    });
  });
});
