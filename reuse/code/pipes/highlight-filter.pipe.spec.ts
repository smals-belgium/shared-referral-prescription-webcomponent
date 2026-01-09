import { HighlightFilterPipe } from './highlight-filter.pipe';

describe('HighlightFilterPipe', () => {
  let pipe: HighlightFilterPipe;
  const value = 'Prescription Kinésithérapie';

  beforeEach(() => {
    pipe = new HighlightFilterPipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return the value unchanged when filter is empty', () => {
    expect(pipe.transform(value, undefined)).toBe(value);
    expect(pipe.transform(value, '')).toBe(value);
  });

  it('should highlight the first occurrence of a match', () => {
    const value = 'Prescription Kinésithérapie avec Kinésithérapie supplémentaire';

    const result = pipe.transform(value, 'Kinésithérapie');

    expect(result).toBe(
      'Prescription <span>Kinésithérapie</span> avec Kinésithérapie supplémentaire'
    );
  });

  it('should match case-insensitively and accent-insensitively', () => {
    const result = pipe.transform(value, 'PRESCRIPTION');
    expect(result).toBe('<span>Prescription</span> Kinésithérapie');
  });

  it('should return the original value when no match is found', () => {
    const result = pipe.transform(value, 'XYZ');
    expect(result).toBe(value);
  });
});
