import {
  isOccurrenceTiming,
  setOccurrenceTimingResponses,
  translateBoundsDuration, translateOccurrenceTiming, validateOccurrenceTiming,
} from './occurrence-timing.utils';
import { BoundsDuration, OccurrenceTiming, UnitsOfTime, Weekday } from '@reuse/code/interfaces';
import { ReadRequestResource } from '@reuse/code/openapi';

const frequencyOnly: OccurrenceTiming = {
  repeat: {
    count: 10,
    frequency: 3,
    period: 1,
    periodUnit: 'wk',
  },
};

const frequencyAndBoundsDuration: OccurrenceTiming = {
  repeat: {
    boundsDuration: {
      value: 3,
      code: 'mo',
      system: '',
    },
    count: 10,
    frequency: 3,
    period: 1,
    periodUnit: 'wk',
  },
};

const frequencyAndSessionDuration: OccurrenceTiming = {
  repeat: {
    count: 10,
    duration: 30,
    durationUnit: 'min',
    frequency: 3,
    period: 1,
    periodUnit: 'wk',
  },
};

const frequencyAndDayOfWeek: OccurrenceTiming = {
  repeat: {
    count: 10,
    frequency: 3,
    period: 1,
    periodUnit: 'wk',
    dayOfWeek: ['mon', 'tue'],
  },
};

const boundsDuration: BoundsDuration = {
  value: 3,
  code: 'mo',
  system: '',
};

const full: OccurrenceTiming = {
  repeat: {
    boundsDuration: boundsDuration,
    count: 10,
    duration: 30,
    durationUnit: 'min',
    frequency: 3,
    period: 1,
    periodUnit: 'wk',
    dayOfWeek: ['mon', 'tue'],
  },
};

describe('OccurrenceTimingUtils', () => {
  it('should return the correct readable treatment frequency when OccurrenceTiming contains boundsDuration, frequency, period, duration and dayOfWeek', () => {
    const readableTextFr = translateOccurrenceTiming(full, 'fr');
    expect(readableTextFr).toBe('3 fois par semaine, le lundi et mardi, une séance de 30 minutes, durant 3 mois');

    const readableTextNl = translateOccurrenceTiming(full, 'nl');
    expect(readableTextNl).toBe(
      '3 keer per week, op maandag en dinsdag, een sessie van 30 minuten, gedurende 3 maanden'
    );
  });

  it('should return the correct readable treatment frequency when OccurrenceTiming contains boundsDuration, frequency and period', () => {
    const readableTextFr = translateOccurrenceTiming(frequencyAndBoundsDuration, 'fr');
    expect(readableTextFr).toBe('3 fois par semaine, durant 3 mois');

    const readableTextNl = translateOccurrenceTiming(frequencyAndBoundsDuration, 'nl');
    expect(readableTextNl).toBe('3 keer per week, gedurende 3 maanden');
  });

  it('should return the correct readable treatment frequency when OccurrenceTiming contains frequency, period and duration', () => {
    const readableTextFr = translateOccurrenceTiming(frequencyAndSessionDuration, 'fr');
    expect(readableTextFr).toBe('3 fois par semaine, une séance de 30 minutes');

    const readableTextNl = translateOccurrenceTiming(frequencyAndSessionDuration, 'nl');
    expect(readableTextNl).toBe('3 keer per week, een sessie van 30 minuten');
  });

  it('should return the correct readable treatment frequency when OccurrenceTiming contains frequency, period and dayOfWeek', () => {
    const readableTextFr = translateOccurrenceTiming(frequencyAndDayOfWeek, 'fr');
    expect(readableTextFr).toBe('3 fois par semaine, le lundi et mardi');

    const readableTextNl = translateOccurrenceTiming(frequencyAndDayOfWeek, 'nl');
    expect(readableTextNl).toBe('3 keer per week, op maandag en dinsdag');
  });

  it('should return the correct readable treatment frequency when OccurrenceTiming contains frequency and period', () => {
    const readableTextFr = translateOccurrenceTiming(frequencyOnly, 'fr');
    expect(readableTextFr).toBe('3 fois par semaine');

    const readableTextNl = translateOccurrenceTiming(frequencyOnly, 'nl');
    expect(readableTextNl).toBe('3 keer per week');
  });

  it('should return the correct bounds duration', () => {
    const readableTextFr = translateBoundsDuration(boundsDuration, 'fr');
    expect(readableTextFr).toBe('3 mois');

    const readableTextNl = translateBoundsDuration(boundsDuration, 'nl');
    expect(readableTextNl).toBe('3 maanden');
  });
});

describe('OccurrenceTimingUtils - Segmented Tests', () => {
  it('should handle frequency = 1 and period = 1 correctly (masculine)', () => {
    const occ: OccurrenceTiming = {
      repeat: {
        frequency: 1,
        period: 1,
        periodUnit: 'd', // masculine
      },
    };
    const fr = translateOccurrenceTiming(occ, 'fr');
    const nl = translateOccurrenceTiming(occ, 'nl');
    expect(fr).toBe('Tous les jours');
    expect(nl).toBe('Elke dag');
  });

  it('should handle frequency = 1 and period > 1 correctly (e.g. every 2 weeks)', () => {
    const occ: OccurrenceTiming = {
      repeat: {
        frequency: 1,
        period: 2,
        periodUnit: 'wk',
      },
    };
    const fr = translateOccurrenceTiming(occ, 'fr');
    const nl = translateOccurrenceTiming(occ, 'nl');
    expect(fr).toBe('Toutes les 2 semaines');
    expect(nl).toBe('Elke 2 weken');
  });

  it('should return only dayOfWeek', () => {
    const occ: OccurrenceTiming = {
      repeat: {
        dayOfWeek: ['mon', 'thu'],
      },
    };
    const fr = translateOccurrenceTiming(occ, 'fr');
    const nl = translateOccurrenceTiming(occ, 'nl');
    expect(fr).toBe('le lundi et jeudi');
    expect(nl).toBe('op maandag en donderdag');
  });

  it('should return only session duration', () => {
    const occ: OccurrenceTiming = {
      repeat: {
        duration: 45,
        durationUnit: 'min',
      },
    };
    const fr = translateOccurrenceTiming(occ, 'fr');
    const nl = translateOccurrenceTiming(occ, 'nl');
    expect(fr).toBe('une séance de 45 minutes');
    expect(nl).toBe('een sessie van 45 minuten');
  });

  it('should return only bounds duration', () => {
    const occ: OccurrenceTiming = {
      repeat: {
        boundsDuration: {
          value: 6,
          code: 'mo',
          system: '',
        },
      },
    };
    const fr = translateOccurrenceTiming(occ, 'fr');
    const nl = translateOccurrenceTiming(occ, 'nl');
    expect(fr).toBe('durant 6 mois');
    expect(nl).toBe('gedurende 6 maanden');
  });
});

describe('OccurrenceTimingUtils - Invalid or Unsupported Cases', () => {
  it('should return empty string if frequency = 0', () => {
    const occ: OccurrenceTiming = {
      repeat: {
        frequency: 0,
        period: 1,
        periodUnit: 'wk',
      },
    };
    expect(translateOccurrenceTiming(occ, 'fr')).toBe('');
    expect(translateOccurrenceTiming(occ, 'nl')).toBe('');
  });

  it('should return empty string if period is missing', () => {
    const occ: OccurrenceTiming = {
      repeat: {
        frequency: 2,
        periodUnit: 'wk',
      },
    };
    expect(translateOccurrenceTiming(occ, 'fr')).toBe('');
    expect(translateOccurrenceTiming(occ, 'nl')).toBe('');
  });

  it('should handle unknown dayOfWeek values gracefully', () => {
    const occ: OccurrenceTiming = {
      repeat: {
        dayOfWeek: ['mon', 'foo' as Weekday],
      },
    };
    expect(translateOccurrenceTiming(occ, 'fr')).toBe('le lundi et foo');
    expect(translateOccurrenceTiming(occ, 'nl')).toBe('op maandag en foo');
  });

  it('should fall back to raw unit code if periodUnit is unknown', () => {
    const occ: OccurrenceTiming = {
      repeat: {
        frequency: 1,
        period: 1,
        periodUnit: 'xyz' as UnitsOfTime,
      },
    };
    expect(translateOccurrenceTiming(occ, 'fr')).toBe('Toutes les xyz');
    expect(translateOccurrenceTiming(occ, 'nl')).toBe('Elke xyz');
  });

  it('should fall back to raw unit code in duration if durationUnit is unknown', () => {
    const occ: OccurrenceTiming = {
      repeat: {
        duration: 20,
        durationUnit: 'abc' as UnitsOfTime,
      },
    };
    expect(translateOccurrenceTiming(occ, 'fr')).toBe('une séance de 20 abc');
    expect(translateOccurrenceTiming(occ, 'nl')).toBe('een sessie van 20 abc');
  });

  it('should handle boundsDuration without value (forced cast)', () => {
    const occ: OccurrenceTiming = {
      repeat: {
        boundsDuration: {
          code: 'mo',
          system: '',
        } as unknown as BoundsDuration,
      },
    };
    const fr = translateOccurrenceTiming(occ, 'fr');
    const nl = translateOccurrenceTiming(occ, 'nl');
    expect(fr).toBe('durant  mois');
    expect(nl).toBe('gedurende  maand');
  });

  it('should return empty string if repeat is empty object', () => {
    const occ: OccurrenceTiming = {
      repeat: {},
    };
    expect(translateOccurrenceTiming(occ, 'fr')).toBe('');
    expect(translateOccurrenceTiming(occ, 'nl')).toBe('');
  });

  it('should return empty string if repeat is empty object', () => {
    const occ: OccurrenceTiming = {
      repeat: {},
    };
    expect(translateOccurrenceTiming(occ, 'fr')).toBe('');
    expect(translateOccurrenceTiming(occ, 'nl')).toBe('');
  });
});

describe('validateOccurrenceTiming', () => {
  it('should validate a correct OccurrenceTiming object', () => {
    const valid: OccurrenceTiming = {
      repeat: {
        frequency: 1,
        period: 2,
        periodUnit: 'wk',
      },
    };
    expect(validateOccurrenceTiming(valid)).toBe(true);
  });

  it('should reject if periodUnit is invalid', () => {
    const invalid = {
      repeat: {
        frequency: 1,
        period: 2,
        periodUnit: 'xxx', // invalid
      },
    };
    expect(validateOccurrenceTiming(invalid)).toBe(false);
  });

  it('should reject if boundsDuration is missing value', () => {
    const invalid = {
      repeat: {
        boundsDuration: {
          code: 'mo',
          system: '',
        },
      },
    };
    expect(validateOccurrenceTiming(invalid)).toBe(false);
  });
});

describe('isOccurrenceTiming', () => {
  it('returns true for a valid OccurrenceTiming object', () => {
    const validValue = { repeat: { frequency: 1 } }; // Mock minimal structure
    expect(isOccurrenceTiming(validValue)).toBe(true);
  });

  it('returns false for an object without repeat', () => {
    const invalidValue = { somethingElse: true };
    expect(isOccurrenceTiming(invalidValue)).toBe(false);
  });

  it('returns false for null', () => {
    expect(isOccurrenceTiming(null)).toBe(false);
  });

  it('returns false for a non-object value (string)', () => {
    expect(isOccurrenceTiming('string')).toBe(false);
  });

  it('returns false for a number', () => {
    expect(isOccurrenceTiming(123)).toBe(false);
  });

  it('returns false for an array', () => {
    expect(isOccurrenceTiming(['repeat'])).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isOccurrenceTiming(undefined)).toBe(false);
  });
});

describe('setOccurrenceTimingResponses', () => {
  it('does nothing if responses is undefined', () => {
    const prescription = {} as ReadRequestResource;
    expect(() => setOccurrenceTimingResponses(prescription)).not.toThrow();
    expect(prescription.responses).toBeUndefined();
  });

  it('does nothing if occurrenceTiming is undefined', () => {
    const prescription = {
      responses: {},
    } as ReadRequestResource;
    setOccurrenceTimingResponses(prescription);
    expect(prescription.responses).not.toHaveProperty('boundsDuration');
  });

  it('does nothing if occurrenceTiming is invalid', () => {
    const prescription = {
      responses: {
        occurrenceTiming: 'invalid',
      },
    } as unknown as ReadRequestResource;

    setOccurrenceTimingResponses(prescription);
    expect(prescription.responses).not.toHaveProperty('boundsDuration');
  });

  it('sets boundsDuration and boundsDurationUnit if present', () => {
    const prescription = {
      responses: {
        occurrenceTiming: {
          repeat: {
            boundsDuration: {
              value: 5,
              code: 'd',
            },
          },
        },
      },
    } as unknown as ReadRequestResource;

    setOccurrenceTimingResponses(prescription);

    expect(prescription.responses?.['boundsDuration']).toBe(5);
    expect(prescription.responses?.['boundsDurationUnit']).toBe('d');
  });

  it('sets sessionDuration and sessionDurationUnit if present', () => {
    const prescription = {
      responses: {
        occurrenceTiming: {
          repeat: {
            duration: 10,
            durationUnit: 'min',
          },
        },
      },
    } as unknown as ReadRequestResource;

    setOccurrenceTimingResponses(prescription);

    expect(prescription.responses?.['sessionDuration']).toBe(10);
    expect(prescription.responses?.['sessionDurationUnit']).toBe('min');
  });

  it('sets dayOfWeek if present', () => {
    const prescription = {
      responses: {
        occurrenceTiming: {
          repeat: {
            dayOfWeek: ['mon', 'wed'],
          },
        },
      },
    } as unknown as ReadRequestResource;

    setOccurrenceTimingResponses(prescription);

    expect(prescription.responses?.['dayOfWeek']).toEqual(['mon', 'wed']);
  });
});

describe('isOccurrenceTiming', () => {
  it('should return true for a valid OccurrenceTiming object', () => {
    const validValue = { repeat: { frequency: 1 } }; // Mock minimal structure
    expect(isOccurrenceTiming(validValue)).toBe(true);
  });

  it('should return false for an object without repeat', () => {
    const invalidValue = { somethingElse: true };
    expect(isOccurrenceTiming(invalidValue)).toBe(false);
  });

  it('should return false for null', () => {
    expect(isOccurrenceTiming(null)).toBe(false);
  });

  it('should return false for a non-object value (string)', () => {
    expect(isOccurrenceTiming('string')).toBe(false);
  });

  it('should return false for a number', () => {
    expect(isOccurrenceTiming(123)).toBe(false);
  });

  it('should return false for an array', () => {
    expect(isOccurrenceTiming(['repeat'])).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(isOccurrenceTiming(undefined)).toBe(false);
  });
});
