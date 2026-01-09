import { SsinOrOrganizationIdPipe } from '@reuse/code/pipes/ssin-or-cbe.pipe';

describe('SsinOrOrganizationIdPipe', () => {
  let pipe: SsinOrOrganizationIdPipe;

  beforeEach(() => {
    pipe = new SsinOrOrganizationIdPipe();
  });

  it('should return ssin when provider is a Professional', () => {
    const provider = {
      type: 'Professional',
      id: { ssin: '12345678901' }
    } as any;

    const result = pipe.transform(provider);

    expect(result).toBe('12345678901');
  });

  it('should return organizationId when provider is an Organization', () => {
    const provider = {
      type: 'Organization',
      id: { organizationId: '987654321' }
    } as any;

    const result = pipe.transform(provider);

    expect(result).toBe('987654321');
  });

  it('should return undefined if id is missing', () => {
    const provider = {
      type: 'Professional',
      id: {}
    } as any;

    const result = pipe.transform(provider);

    expect(result).toBeUndefined();
  });

  it('should return undefined if provider has no id', () => {
    const provider = {
      type: 'Organization'
    } as any;

    const result = pipe.transform(provider);

    expect(result).toBeUndefined();
  });
});
