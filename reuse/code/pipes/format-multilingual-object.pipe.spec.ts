import { FormatMultilingualObjectPipe } from './format-multilingual-object.pipe';
import { Translation } from '@reuse/code/openapi';
import { Lang } from '@reuse/code/constants/languages';

describe('FormatMultilingualObjectPipe', () => {
  let pipe: FormatMultilingualObjectPipe;

  beforeEach(() => {
    pipe = new FormatMultilingualObjectPipe();
  });

  const value: Translation = {
    fr: 'Bonjour',
    en: 'Hello',
    nl: 'Hallo',
    de: 'Hallo DE',
  };

  it('should return empty string when value is undefined', () => {
    expect(pipe.transform(undefined)).toBe('');
  });

  it('should return default FR when no userLang provided', () => {
    expect(pipe.transform(value)).toBe('Bonjour');
  });

  it('should return correct translation for valid language code', () => {
    expect(pipe.transform(value, Lang.FR.short)).toBe('Bonjour');
    expect(pipe.transform(value, Lang.NL.short)).toBe('Hallo');
    expect(pipe.transform(value, Lang.DE.short)).toBe('Hallo DE');
    expect(pipe.transform(value, Lang.EN.short)).toBe('Hello');
  });

  it('should return empty string when lang not found in value', () => {
    expect(pipe.transform(value, 'it')).toBe('');
  });

  it('sould fall back to FR when userLang is an empty string', () => {
    expect(pipe.transform(value, '')).toBe('Bonjour');
  });
});
