import { TranslateByIntentPipe } from './translate-by-intent.pipe';
import { TranslateService } from '@ngx-translate/core';
import { Intent } from '@reuse/code/interfaces';

describe('TranslateByIntentPipe (Jest)', () => {
  let pipe: TranslateByIntentPipe;
  let translateMock: jest.Mocked<TranslateService>;

  beforeEach(() => {
    translateMock = {
      instant: jest.fn()
    } as any;

    pipe = new TranslateByIntentPipe(translateMock);
  });

  it('should translate ORDER intent', () => {
    translateMock.instant.mockReturnValue('ORDER');

    const result = pipe.transform(Intent.ORDER, {
      order: 'order.key',
      proposal: 'proposal.key'
    });

    expect(translateMock.instant).toHaveBeenCalledWith('order.key', undefined);
    expect(result).toBe('ORDER');
  });

  it('should translate PROPOSAL intent', () => {
    translateMock.instant.mockReturnValue('PROPOSAL');

    const result = pipe.transform(Intent.PROPOSAL, {
      order: 'order.key',
      proposal: 'proposal.key'
    });

    expect(translateMock.instant).toHaveBeenCalledWith('proposal.key', undefined);
    expect(result).toBe('PROPOSAL');
  });

  it('should translate MODEL intent when keys.model exists', () => {
    translateMock.instant.mockReturnValue('MODEL');

    const result = pipe.transform(Intent.MODEL, {
      order: 'order.key',
      proposal: 'proposal.key',
      model: 'model.key'
    });

    expect(translateMock.instant).toHaveBeenCalledWith('model.key', undefined);
    expect(result).toBe('MODEL');
  });

  it('should fallback to order.key when MODEL has no model key', () => {
    translateMock.instant.mockReturnValue('ORDER');

    const result = pipe.transform(Intent.MODEL, {
      order: 'order.key',
      proposal: 'proposal.key'
    });

    expect(translateMock.instant).toHaveBeenCalledWith('order.key', undefined);
    expect(result).toBe('ORDER');
  });

  it('should use default key when unknown intent and default exists', () => {
    translateMock.instant.mockReturnValue('DEFAULT_TEXT');

    const result = pipe.transform('unknown', {
      order: 'order.key',
      proposal: 'proposal.key',
      default: 'default.key'
    });

    expect(translateMock.instant).toHaveBeenCalledWith('default.key', undefined);
    expect(result).toBe('DEFAULT_TEXT');
  });

  it('should fallback to order.key when unknown intent and no default', () => {
    translateMock.instant.mockReturnValue('ORDER');

    const result = pipe.transform('unknown', {
      order: 'order.key',
      proposal: 'proposal.key'
    });

    expect(translateMock.instant).toHaveBeenCalledWith('order.key', undefined);
    expect(result).toBe('ORDER');
  });
});
