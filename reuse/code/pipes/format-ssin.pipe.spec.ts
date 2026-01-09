import { FormatSsinPipe } from './format-ssin.pipe';

describe('FormatSsinPipe', () => {
  let pipe: FormatSsinPipe;

  beforeEach(() => {
    pipe = new FormatSsinPipe();
  });

  it('should return empty string when value is undefined or empty', () => {
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform('')).toBe('');
  });

  it('should format a fully valid SSIN', () => {
    expect(pipe.transform('12345678901')).toBe('12.34.56-789.01');
  });
});
