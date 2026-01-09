import { FormatNihdiPipe } from './format-nihdi.pipe';

describe('FormatNihdiPipe', () => {
  let pipe: FormatNihdiPipe;

  beforeEach(() => {
    pipe = new FormatNihdiPipe();
  });

  it('should return empty string when value is undefined', () => {
    expect(pipe.transform()).toBe('');
    expect(pipe.transform(undefined)).toBe('');
  });

  it('should append qualificationCode when value has length = 8', () => {
    expect(pipe.transform('12a34b56c78')).toBe('1/23456/78/');
  });

  it('should remove non-numeric characters', () => {
    expect(pipe.transform('12a34b56c78')).toBe('1/23456/78/');
  });

  it('should apply mask properly for a longer number', () => {
    expect(pipe.transform('0123456789012')).toBe('0/12345/67/890');
  });

  it('should format properly without qualificationCode', () => {
    expect(pipe.transform('123456789012')).toBe('1/23456/78/901');
  });

  it('should format properly with qualificationCode', () => {
    expect(pipe.transform('12345678', '9012')).toBe('1/23456/78/901');
  });
});
