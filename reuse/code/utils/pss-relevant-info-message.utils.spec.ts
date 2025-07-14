import { generateWarningMessage } from './pss-relevant-info-message.utils';

describe('generateWarningMessage', () => {
  it('should return a message with one relevant info in French', () => {
    const result = generateWarningMessage(['tmp-addInfo-diab'], [], 'fr');

    expect(result).toContain('Les informations pertinentes');
    expect(result).toContain('• Diabète');
  });

  it('should return a message with implants only in Dutch', () => {
    const result = generateWarningMessage([], ['tmp-impl-stent', 'tmp-impl-elec'], 'nl');

    expect(result).toContain('De onderstaande relevante informatie');
    expect(result).toContain('• Implantaten (endoprothese (bv. stent), electrode)');
  });

  it('should return a combined message with implants and relevant info in French', () => {
    const result = generateWarningMessage(['tmp-addInfo-diab', 'tmp-addInfo-impl'], ['tmp-impl-stent'], 'fr');

    expect(result).toContain('• Implants (endoprothèses (p.ex. stents))');
    expect(result).toContain('• Diabète');
    expect(result).not.toContain('tmp-addInfo-impl');
  });

  it('should ignore unknown implant keys', () => {
    const result = generateWarningMessage([], ['unknown-implant'], 'fr');

    expect(result).toContain('Implants'); // default label should still appear
    expect(result).not.toContain('unknown-implant');
  });

  it('should ignore unknown relevant info keys', () => {
    const result = generateWarningMessage(['tmp-unknown'], [], 'fr');

    expect(result).toBe('');
  });

  it('should return an empty string when both inputs are empty', () => {
    const result = generateWarningMessage([], [], 'fr');

    expect(result).toBe('');
  });

  it('should render generic implant and info labels correctly in Dutch', () => {
    const result = generateWarningMessage(['tmp-addInfo'], ['tmp-impl'], 'nl');

    expect(result).toContain('• Implantaten (andere)');
    expect(result).toContain('• Andere');
  });
});
