import { DemoPseudoService } from './demo-pseudo.service';
import { EHealthProblem } from '@smals-belgium-shared/pseudo-helper';
import { pseudonymInTransitMock } from '@reuse/code/demo/mocks/pseudonymInTransit';

describe('DemoPseudoService', () => {
  let service: DemoPseudoService;

  beforeEach(() => {
    service = new DemoPseudoService();
  });

  describe('pseudonymize', () => {
    it('should resolve with the input value', async () => {
      const result = await service.pseudonymize('test-value');
      expect(result).toBe('test-value');
    });
  });

  describe('identify', () => {
    it('should resolve with the input value', async () => {
      const result = await service.identify('identity-123');
      expect(result).toBe('identity-123');
    });
  });

  describe('pseudonymizeValue', () => {
    it('should return short string on successful pseudonymization', async () => {
      const mockValue = {
        pseudonymize: jest.fn().mockResolvedValue({
          asShortString: () => 'short-pseudo',
        }),
      };

      const result = await service.pseudonymizeValue(mockValue as any);
      expect(result).toBe('short-pseudo');
      expect(mockValue.pseudonymize).toHaveBeenCalled();
    });

    it('should throw error when result is EHealthProblemMock', async () => {
      const problem = new EHealthProblem();
      problem.title = 'Pseudonymization failed';
      problem.detail = 'Invalid input';

      const mockValue = {
        pseudonymize: jest.fn().mockResolvedValue(problem),
      };

      await expect(service.pseudonymizeValue(mockValue as any)).rejects.toThrow('Pseudonymization failed');
    });
  });

  describe('byteArrayToValue', () => {
    it('should throw pseudonymization not enabled error', () => {
      expect(() => service.byteArrayToValue()).toThrow('Pseudomization not enabled.');
    });
  });

  describe('identifyPseudonymInTransit', () => {
    it('should return bytes on successful identification', async () => {
      const mockPseudonymInTransit = {
        identify: jest.fn().mockResolvedValue({
          asBytes: () => new Uint8Array([1, 2, 3]),
        }),
      };

      const result = await service.identifyPseudonymInTransit(mockPseudonymInTransit as any);
      expect(result).toEqual(new Uint8Array([1, 2, 3]));
      expect(mockPseudonymInTransit.identify).toHaveBeenCalled();
    });

    it('should throw error when result is EHealthProblemMock', async () => {
      const problem = new EHealthProblem();
      problem.title = 'Identification failed';
      problem.detail = 'Not found';

      const mockPseudonymInTransit = {
        identify: jest.fn().mockResolvedValue(problem),
      };

      await expect(service.identifyPseudonymInTransit(mockPseudonymInTransit as any)).rejects.toThrow(
        'Identification failed'
      );
    });
  });

  describe('toPseudonymInTransit', () => {
    it('should return pseudonymInTransitMock', () => {
      const result = service.toPseudonymInTransit();
      expect(result).toBe(pseudonymInTransitMock);
    });
  });
});
