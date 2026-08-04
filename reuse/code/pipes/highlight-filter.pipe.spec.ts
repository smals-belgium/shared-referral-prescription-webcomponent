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

  it('should highlight the first found match in name', () => {
    const value = 'Andreas';

    const result = pipe.transform(value, 'andré');

    expect(result).toBe('<span class="highlight">Andre</span>as');
  });

  it('should match case-insensitively and accent-insensitively', () => {
    const result = pipe.transform(value, 'PRESCRIPTION');
    expect(result).toBe('<span class="highlight">Prescription</span> Kinésithérapie');
  });

  it('should return the original value when no match is found', () => {
    const result = pipe.transform(value, 'XYZ');
    expect(result).toBe(value);
  });

  it('highlights each token across separate column values', () => {
    const filter = 'Ann verh.';
    expect(pipe.transform('Verhofstadt', filter)).toBe('<span class="highlight">Verh</span>ofstadt');
    expect(pipe.transform('Ann', filter)).toBe('<span class="highlight">Ann</span>');
  });

  it('matches when value has the words in the opposite order (lastname firstname)', () => {
    expect(pipe.transform('Verhofstadt Ann', 'Ann verh.')).toBe(
      '<span class="highlight">Verh</span>ofstadt <span class="highlight">Ann</span>'
    );
  });

  it('highlights every occurrence of a term', () => {
    expect(pipe.transform('Anna and Anneliese', 'an')).toBe(
      '<span class="highlight">An</span>na ' +
        '<span class="highlight">an</span>d ' +
        '<span class="highlight">An</span>neliese'
    );
  });

  it('merges overlapping matches into a single span', () => {
    expect(pipe.transform('Anna', 'ann nna')).toBe('<span class="highlight">Anna</span>');
  });

  describe('exact-order', () => {
    it('should highlight the first occurrence of a match', () => {
      const value = 'Prescription Kinésithérapie avec Kinésithérapie supplémentaire';

      expect(pipe.transform(value, 'Kinésithérapie', true)).toBe(
        'Prescription <span class="highlight">Kinésithérapie</span> avec Kinésithérapie supplémentaire'
      );
    });

    it('highlights the full phrase when found contiguously', () => {
      expect(pipe.transform('Ann Verhofstadt', 'Ann verh', true)).toBe(
        '<span class="highlight">Ann Verh</span>ofstadt'
      );
    });

    it('does not highlight when terms are out of order', () => {
      expect(pipe.transform('Verhofstadt Ann', 'Ann verh', true)).toBe('Verhofstadt Ann');
    });
  });
});
