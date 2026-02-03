import { FormatSsinPipe } from './format-ssin.pipe';

describe('FormatSsinPipe', () => {
  let pipe: FormatSsinPipe;

  beforeEach(() => {
    pipe = new FormatSsinPipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return empty string when value is undefined', () => {
    expect(pipe.transform(undefined)).toBe('');
  });

  it('should return empty string when value is empty', () => {
    expect(pipe.transform('')).toBe('');
  });

  it('should remove non-digit characters', () => {
    expect(pipe.transform('12a34b56c78901')).toBe('12.34.56-789.01');
  });

  it('should format valid SSIN with 11 digits', () => {
    expect(pipe.transform('12345678901')).toBe('12.34.56-789.01');
  });

  it('should return digits as-is if length is not 11', () => {
    expect(pipe.transform('1234567')).toBe('1234567');
  });

  it('should return digits only if input contains separators and length is not 11', () => {
    expect(pipe.transform('12.34.56-78')).toBe('12345678');
  });
});
