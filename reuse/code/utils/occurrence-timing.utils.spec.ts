import { translateOccurrenceTiming, validateOccurrenceTiming } from './occurrence-timing.utils';
import { BoundsDuration, OccurrenceTiming, UnitsOfTime, Weekday } from '@reuse/code/interfaces';

const frequencyOnly: OccurrenceTiming = {
  "repeat": {
    "count": 10,
    "frequency": 3,
    "period": 1,
    "periodUnit": "wk"
  }
}

const frequencyAndBoundsDuration: OccurrenceTiming = {
  "repeat": {
    "boundsDuration":{
      "value": 3,
      "code": "mo",
      "system": ""
    },
    "count": 10,
    "frequency": 3,
    "period": 1,
    "periodUnit": "wk"
  }
}

const frequencyAndSessionDuration: OccurrenceTiming = {
  "repeat": {
    "count": 10,
    "duration": 30,
    "durationUnit": "min",
    "frequency": 3,
    "period": 1,
    "periodUnit": "wk"
  }
}

const frequencyAndDayOfWeek : OccurrenceTiming  = {
  "repeat": {
    "count": 10,
    "frequency": 3,
    "period": 1,
    "periodUnit": "wk",
    "dayOfWeek": ["mon", "tue"]
  }
}

const full : OccurrenceTiming = {
  "repeat": {
    "boundsDuration":{
      "value": 3,
      "code": "mo",
      "system": ""
    },
    "count": 10,
    "duration": 30,
    "durationUnit": "min",
    "frequency": 3,
    "period": 1,
    "periodUnit": "wk",
    "dayOfWeek": ["mon", "tue"]
  }
}

describe('OccurrenceTimingUtils', () => {
  it('should return the correct readable treatment frequency when OccurrenceTiming contains boundsDuration, frequency, period, duration and dayOfWeek', () => {

    let readableTextFr = translateOccurrenceTiming(full, 'fr');
    expect(readableTextFr).toBe("3 fois par semaine, le lundi et mardi, une séance de 30 minutes, durant 3 mois")

    let readableTextNl = translateOccurrenceTiming(full, 'nl');
    expect(readableTextNl).toBe("3 keer per week, op maandag en dinsdag, een sessie van 30 minuten, gedurende 3 maanden")

  })

  it('should return the correct readable treatment frequency when OccurrenceTiming contains boundsDuration, frequency and period', () => {

    let readableTextFr = translateOccurrenceTiming(frequencyAndBoundsDuration, 'fr');
    expect(readableTextFr).toBe("3 fois par semaine, durant 3 mois")

    let readableTextNl = translateOccurrenceTiming(frequencyAndBoundsDuration, 'nl');
    expect(readableTextNl).toBe("3 keer per week, gedurende 3 maanden")

  })

  it('should return the correct readable treatment frequency when OccurrenceTiming contains frequency, period and duration', () => {

    let readableTextFr = translateOccurrenceTiming(frequencyAndSessionDuration, 'fr');
    expect(readableTextFr).toBe("3 fois par semaine, une séance de 30 minutes")

    let readableTextNl = translateOccurrenceTiming(frequencyAndSessionDuration, 'nl');
    expect(readableTextNl).toBe("3 keer per week, een sessie van 30 minuten")

  })

  it('should return the correct readable treatment frequency when OccurrenceTiming contains frequency, period and dayOfWeek', () => {

    let readableTextFr = translateOccurrenceTiming(frequencyAndDayOfWeek, 'fr');
    expect(readableTextFr).toBe("3 fois par semaine, le lundi et mardi")

    let readableTextNl = translateOccurrenceTiming(frequencyAndDayOfWeek, 'nl');
    expect(readableTextNl).toBe("3 keer per week, op maandag en dinsdag")

  })

  it('should return the correct readable treatment frequency when OccurrenceTiming contains frequency and period', () => {

    let readableTextFr = translateOccurrenceTiming(frequencyOnly, 'fr');
    expect(readableTextFr).toBe("3 fois par semaine")

    let readableTextNl = translateOccurrenceTiming(frequencyOnly, 'nl');
    expect(readableTextNl).toBe("3 keer per week")

  })
})

describe('OccurrenceTimingUtils - Segmented Tests', () => {

  it('should handle frequency = 1 and period = 1 correctly (masculine)', () => {
    const occ: OccurrenceTiming = {
      repeat: {
        frequency: 1,
        period: 1,
        periodUnit: 'd' // masculine
      }
    };
    const fr = translateOccurrenceTiming(occ, 'fr');
    const nl = translateOccurrenceTiming(occ, 'nl');
    expect(fr).toBe("Tous les jours");
    expect(nl).toBe("Elke dag");
  });

  it('should handle frequency = 1 and period > 1 correctly (e.g. every 2 weeks)', () => {
    const occ: OccurrenceTiming = {
      repeat: {
        frequency: 1,
        period: 2,
        periodUnit: 'wk'
      }
    };
    const fr = translateOccurrenceTiming(occ, 'fr');
    const nl = translateOccurrenceTiming(occ, 'nl');
    expect(fr).toBe("Toutes les 2 semaines");
    expect(nl).toBe("Elke 2 weken");
  });

  it('should return only dayOfWeek', () => {
    const occ: OccurrenceTiming = {
      repeat: {
        dayOfWeek: ['mon', 'thu']
      }
    };
    const fr = translateOccurrenceTiming(occ, 'fr');
    const nl = translateOccurrenceTiming(occ, 'nl');
    expect(fr).toBe("le lundi et jeudi");
    expect(nl).toBe("op maandag en donderdag");
  });

  it('should return only session duration', () => {
    const occ: OccurrenceTiming = {
      repeat: {
        duration: 45,
        durationUnit: 'min'
      }
    };
    const fr = translateOccurrenceTiming(occ, 'fr');
    const nl = translateOccurrenceTiming(occ, 'nl');
    expect(fr).toBe("une séance de 45 minutes");
    expect(nl).toBe("een sessie van 45 minuten");
  });

  it('should return only bounds duration', () => {
    const occ: OccurrenceTiming = {
      repeat: {
        boundsDuration: {
          value: 6,
          code: 'mo',
          system: ""
        }
      }
    };
    const fr = translateOccurrenceTiming(occ, 'fr');
    const nl = translateOccurrenceTiming(occ, 'nl');
    expect(fr).toBe("durant 6 mois");
    expect(nl).toBe("gedurende 6 maanden");
  });


});

describe('OccurrenceTimingUtils - Invalid or Unsupported Cases', () => {

  it('should return empty string if frequency = 0', () => {
    const occ: OccurrenceTiming = {
      repeat: {
        frequency: 0,
        period: 1,
        periodUnit: 'wk'
      }
    };
    expect(translateOccurrenceTiming(occ, 'fr')).toBe("");
    expect(translateOccurrenceTiming(occ, 'nl')).toBe("");
  });

  it('should return empty string if period is missing', () => {
    const occ: OccurrenceTiming = {
      repeat: {
        frequency: 2,
        periodUnit: 'wk'
      }
    };
    expect(translateOccurrenceTiming(occ, 'fr')).toBe("");
    expect(translateOccurrenceTiming(occ, 'nl')).toBe("");
  });

  it('should handle unknown dayOfWeek values gracefully', () => {
    const occ: OccurrenceTiming = {
      repeat: {
        dayOfWeek: ['mon', 'foo' as Weekday]
      }
    };
    expect(translateOccurrenceTiming(occ, 'fr')).toBe("le lundi et foo");
    expect(translateOccurrenceTiming(occ, 'nl')).toBe("op maandag en foo");
  });

  it('should fall back to raw unit code if periodUnit is unknown', () => {
    const occ: OccurrenceTiming = {
      repeat: {
        frequency: 1,
        period: 1,
        periodUnit: 'xyz' as UnitsOfTime
      }
    };
    expect(translateOccurrenceTiming(occ, 'fr')).toBe("Toutes les xyz");
    expect(translateOccurrenceTiming(occ, 'nl')).toBe("Elke xyz");
  });

  it('should fall back to raw unit code in duration if durationUnit is unknown', () => {
    const occ: OccurrenceTiming = {
      repeat: {
        duration: 20,
        durationUnit: 'abc' as UnitsOfTime
      }
    };
    expect(translateOccurrenceTiming(occ, 'fr')).toBe("une séance de 20 abc");
    expect(translateOccurrenceTiming(occ, 'nl')).toBe("een sessie van 20 abc");
  });

  it('should handle boundsDuration without value (forced cast)', () => {
    const occ: OccurrenceTiming = {
      repeat: {
        boundsDuration: {
          code: 'mo',
          system: ''
        } as unknown as BoundsDuration
      }
    };
    const fr = translateOccurrenceTiming(occ, 'fr');
    const nl = translateOccurrenceTiming(occ, 'nl');
    expect(fr).toBe("durant  mois");
    expect(nl).toBe("gedurende  maand");
  });

  it('should return empty string if repeat is empty object', () => {
    const occ: OccurrenceTiming = {
      repeat: {}
    };
    expect(translateOccurrenceTiming(occ, 'fr')).toBe("");
    expect(translateOccurrenceTiming(occ, 'nl')).toBe("");
  });

  it('should return empty string if repeat is empty object', () => {
    const occ: OccurrenceTiming = {
      repeat: {}
    };
    expect(translateOccurrenceTiming(occ, 'fr')).toBe("");
    expect(translateOccurrenceTiming(occ, 'nl')).toBe("");
  });


});

describe('validateOccurrenceTiming', () => {
  it('should validate a correct OccurrenceTiming object', () => {
    const valid: OccurrenceTiming = {
      repeat: {
        frequency: 1,
        period: 2,
        periodUnit: 'wk'
      }
    };
    expect(validateOccurrenceTiming(valid)).toBe(true);
  });

  it('should reject if periodUnit is invalid', () => {
    const invalid = {
      repeat: {
        frequency: 1,
        period: 2,
        periodUnit: 'xxx' // invalid
      }
    };
    expect(validateOccurrenceTiming(invalid)).toBe(false);
  });

  it('should reject if boundsDuration is missing value', () => {
    const invalid = {
      repeat: {
        boundsDuration: {
          code: 'mo',
          system: ''
        }
      }
    };
    expect(validateOccurrenceTiming(invalid)).toBe(false);
  });
});
