import { FormatMultilingualObjectPipe } from './format-multilingual-object.pipe';
import { Translation } from '@reuse/code/openapi';

describe('FormatMultilingualObjectPipe', () => {
  let pipe: FormatMultilingualObjectPipe;

  beforeEach(() => {
    pipe = new FormatMultilingualObjectPipe();
  });

  const value: Translation = {
    fr: 'Bonjour',
    en: 'Hello',
    nl: 'Hallo',
    de: 'Hallo DE'
  };

  it('should return empty string when value is undefined', () => {
    expect(pipe.transform(undefined)).toBe('');
  });

  it('should return default FR when no userLang provided', () => {
    expect(pipe.transform(value)).toBe('Bonjour');
  });

  it('should return correct translation for valid language code', () => {
    expect(pipe.transform(value, 'fr')).toBe('Bonjour');
    expect(pipe.transform(value, 'nl')).toBe('Hallo');
    expect(pipe.transform(value, 'de')).toBe('Hallo DE');
    expect(pipe.transform(value, 'en-US')).toBe('Hello');
  });

  it('should return empty string when lang not found in value', () => {
    expect(pipe.transform(value, 'it')).toBe('');
  });

  it('sould fall back to FR when userLang is an empty string', () => {
    expect(pipe.transform(value, '')).toBe('Bonjour');
  });
});
