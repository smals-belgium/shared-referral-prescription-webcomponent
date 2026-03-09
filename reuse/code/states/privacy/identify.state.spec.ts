import { TestBed } from '@angular/core/testing';
import { IdentifyState } from './identify.state';
import { PseudoService } from '@reuse/code/services/privacy/pseudo.service';
import { LoadingStatus } from '@reuse/code/interfaces';

describe('IdentifyState', () => {
  let state: IdentifyState;
  let pseudoService: jest.Mocked<PseudoService>;

  beforeEach(() => {
    pseudoService = {
      identify: jest.fn(),
    } as unknown as jest.Mocked<PseudoService>;

    TestBed.configureTestingModule({
      providers: [IdentifyState, { provide: PseudoService, useValue: pseudoService }],
    });

    state = TestBed.inject(IdentifyState);
  });

  it('should initialize with INITIAL status', () => {
    expect(state.state().status).toBe(LoadingStatus.INITIAL);
  });

  describe('loadSSIN', () => {
    it('should set SUCCESS when identify resolves', async () => {
      pseudoService.identify.mockResolvedValue('123456');

      state.loadSSIN('encrypted');

      // Wait microtask queue
      await Promise.resolve();

      expect(state.state().status).toBe(LoadingStatus.SUCCESS);
      expect(state.state().data).toBe('123456');
    });

    it('should set ERROR when identify rejects', async () => {
      pseudoService.identify.mockRejectedValue(new Error('failed'));

      state.loadSSIN('encrypted');

      await Promise.resolve();

      expect(state.state().status).toBe(LoadingStatus.ERROR);
    });
  });

  describe('setSSIN', () => {
    it('should directly set SUCCESS state', () => {
      state.setSSIN('999');

      expect(state.state().status).toBe(LoadingStatus.SUCCESS);
      expect(state.state().data).toBe('999');
    });
  });
});
