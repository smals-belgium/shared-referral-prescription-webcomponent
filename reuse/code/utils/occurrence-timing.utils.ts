import { OccurrenceTiming, UnitsOfTime } from '../interfaces';

const translations = {
  every: {
    masculine: {
      nl: 'Elke',
      fr: 'Tous les'
    },
    feminine: {
      nl: 'Elke',
      fr: 'Toutes les'
    }
  },
  timesPer: {
    nl: 'keer per',
    fr: 'fois par'
  },
  on: {
    nl: 'op',
    fr: 'le'
  },
  and: {
    nl: 'en',
    fr: 'et'
  },
  during: {
    nl: 'gedurende',
    fr: 'durant'
  },
  unitsOfTime: {
    one: {
      s: {
        nl: 'seconde',
        fr: 'seconde'
      },
      min: {
        nl: 'minuut',
        fr: 'minute'
      },
      h: {
        nl: 'uur',
        fr: 'heure'
      },
      d: {
        nl: 'dag',
        fr: 'jour'
      },
      wk: {
        nl: 'week',
        fr: 'semaine'
      },
      mo: {
        nl: 'maand',
        fr: 'mois'
      },
      a: {
        nl: 'jaar',
        fr: 'an'
      },
    },
    multiple: {
      s: {
        nl: 'seconden',
        fr: 'secondes'
      },
      min: {
        nl: 'minuten',
        fr: 'minutes'
      },
      h: {
        nl: 'uren',
        fr: 'heures'
      },
      d: {
        nl: 'dagen',
        fr: 'jours'
      },
      wk: {
        nl: 'weken',
        fr: 'semaines'
      },
      mo: {
        nl: 'maanden',
        fr: 'mois'
      },
      a: {
        nl: 'jaren',
        fr: 'ans'
      },
    }
  },
  weekdays: {
    mon: {
      nl: 'maandag',
      fr: 'lundi'
    },
    tue: {
      nl: 'dinsdag',
      fr: 'mardi'
    },
    wed: {
      nl: 'woensdag',
      fr: 'mercredi'
    },
    thu: {
      nl: 'donderdag',
      fr: 'jeudi'
    },
    fri: {
      nl: 'vrijdag',
      fr: 'vendredi'
    },
    sat: {
      nl: 'zaterdag',
      fr: 'samedi'
    },
    sun: {
      nl: 'zondag',
      fr: 'dimanche'
    },
  }
};

export function translateOccurrenceTiming(occurrenceTiming: OccurrenceTiming, language: 'nl' | 'fr'): string {
  return [
    translateFrequencyAndPeriod(occurrenceTiming, language),
    translateDayOfWeek(occurrenceTiming, language),
    translateDuration(occurrenceTiming, language),
  ].join(' ');
}

export function translateFrequencyAndPeriod(occurrenceTiming: OccurrenceTiming, language: 'nl' | 'fr'): string {
  const words = [];
  if (occurrenceTiming.repeat?.frequency && occurrenceTiming.repeat?.frequency > 0) {
    if (occurrenceTiming.repeat.frequency > 1 && occurrenceTiming.repeat.period === 1) {
      words.push(occurrenceTiming.repeat.frequency);
      words.push(translations.timesPer[language]);
      words.push(translateTimeUnit(occurrenceTiming.repeat.period, occurrenceTiming.repeat.periodUnit, language));
    } else if (occurrenceTiming.repeat.frequency === 1 && occurrenceTiming.repeat.period === 1) {
      words.push(translateEvery(occurrenceTiming, language));
      words.push(translateTimeUnit(language === 'fr' ? 2 : 1, occurrenceTiming.repeat.periodUnit, language));
    } else if (occurrenceTiming.repeat.frequency === 1 && occurrenceTiming.repeat.period && occurrenceTiming.repeat.period > 1) {
      words.push(translateEvery(occurrenceTiming, language));
      words.push(occurrenceTiming.repeat.period);
      words.push(translateTimeUnit(occurrenceTiming.repeat.period, occurrenceTiming.repeat.periodUnit, language));
    } else if (occurrenceTiming.repeat.frequency > 1 && occurrenceTiming.repeat.period && occurrenceTiming.repeat.period > 1) {
      words.push(occurrenceTiming.repeat.frequency);
      words.push(translations.timesPer[language]);
      words.push(occurrenceTiming.repeat.period);
      words.push(translateTimeUnit(occurrenceTiming.repeat.period, occurrenceTiming.repeat.periodUnit, language));
    }
  }
  return words.join(' ');
}

function translateEvery(occurrenceTiming: OccurrenceTiming, language: 'nl' | 'fr'): string {
  const gender = occurrenceTiming.repeat.periodUnit && ['d', 'mo', 'a'].includes(occurrenceTiming.repeat.periodUnit)
    ? 'masculine'
    : 'feminine';
  return translations.every[gender][language];
}

export function translateDayOfWeek(occurrenceTiming: OccurrenceTiming, language: 'nl' | 'fr'): string {
  const words = [];
  if (occurrenceTiming.repeat.dayOfWeek?.length) {
    const translatedDays = occurrenceTiming.repeat.dayOfWeek
      .map((d) => translations.weekdays[d]?.[language] || d);
    const last = translatedDays.pop();

    words.push(translations.on[language]);
    if (translatedDays.length > 0) {
      words.push(translatedDays.join(', '));
      words.push(translations.and[language]);
    }
    words.push(last);
  }
  return words.join(' ');
}

export function translateDuration(occurrenceTiming: OccurrenceTiming, language: 'nl' | 'fr'): string {
  const words = [];
  if (occurrenceTiming.repeat.duration) {
    words.push(translations.during[language]);
    words.push(occurrenceTiming.repeat.duration);
    if (occurrenceTiming.repeat.durationUnit) {
      words.push(translateTimeUnit(occurrenceTiming.repeat.duration, occurrenceTiming.repeat.durationUnit, language));
    }
  }
  return words.join(' ');
}

export function translateTimeUnit(unit = 1, unitOfTime?: UnitsOfTime, language: 'nl' | 'fr' = 'nl'): string {
  const oneOrMultiple = unit !== 1 ? 'multiple' : 'one';
  return unitOfTime
    ? translations.unitsOfTime[oneOrMultiple][unitOfTime]?.[language] || unitOfTime
    : '';
}
