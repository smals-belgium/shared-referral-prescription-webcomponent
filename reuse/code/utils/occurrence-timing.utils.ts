import { OccurrenceTiming, UnitsOfTime, Weekday } from '@reuse/code/interfaces';
import { ReadRequestResource } from '@reuse/code/openapi';

const translations = {
  every: {
    masculine: {
      nl: 'Elke',
      fr: 'Tous les',
    },
    feminine: {
      nl: 'Elke',
      fr: 'Toutes les',
    },
  },
  timesPer: {
    nl: 'keer per',
    fr: 'fois par',
  },
  on: {
    nl: 'op',
    fr: 'le',
  },
  and: {
    nl: 'en',
    fr: 'et',
  },
  sessionDuration: {
    nl: 'een sessie van',
    fr: 'une séance de',
  },
  during: {
    nl: 'gedurende',
    fr: 'durant',
  },
  unitsOfTime: {
    one: {
      s: {
        nl: 'seconde',
        fr: 'seconde',
      },
      min: {
        nl: 'minuut',
        fr: 'minute',
      },
      h: {
        nl: 'uur',
        fr: 'heure',
      },
      d: {
        nl: 'dag',
        fr: 'jour',
      },
      wk: {
        nl: 'week',
        fr: 'semaine',
      },
      mo: {
        nl: 'maand',
        fr: 'mois',
      },
      a: {
        nl: 'jaar',
        fr: 'an',
      },
    },
    multiple: {
      s: {
        nl: 'seconden',
        fr: 'secondes',
      },
      min: {
        nl: 'minuten',
        fr: 'minutes',
      },
      h: {
        nl: 'uren',
        fr: 'heures',
      },
      d: {
        nl: 'dagen',
        fr: 'jours',
      },
      wk: {
        nl: 'weken',
        fr: 'semaines',
      },
      mo: {
        nl: 'maanden',
        fr: 'mois',
      },
      a: {
        nl: 'jaren',
        fr: 'ans',
      },
    },
  },
  weekdays: {
    mon: {
      nl: 'maandag',
      fr: 'lundi',
    },
    tue: {
      nl: 'dinsdag',
      fr: 'mardi',
    },
    wed: {
      nl: 'woensdag',
      fr: 'mercredi',
    },
    thu: {
      nl: 'donderdag',
      fr: 'jeudi',
    },
    fri: {
      nl: 'vrijdag',
      fr: 'vendredi',
    },
    sat: {
      nl: 'zaterdag',
      fr: 'samedi',
    },
    sun: {
      nl: 'zondag',
      fr: 'dimanche',
    },
  },
};

export function translateOccurrenceTiming(occurrenceTiming: OccurrenceTiming, language: 'nl' | 'fr'): string {
  const words = [];
  const frequencyAndPeriod = translateFrequencyAndPeriod(occurrenceTiming, language);
  const dayOfWeek = translateDayOfWeek(occurrenceTiming, language);
  const duration = translateDuration(occurrenceTiming, language);
  const boundsDuration = translateBoundsDuration(occurrenceTiming, language);
  if (frequencyAndPeriod.toString().trim().length != 0) {
    words.push(frequencyAndPeriod);
  }
  if (dayOfWeek.toString().trim().length != 0) {
    words.push(dayOfWeek);
  }
  if (duration.toString().trim().length != 0) {
    words.push(duration);
  }
  if (boundsDuration.toString().trim().length != 0) {
    words.push(boundsDuration);
  }
  return words.join(', ');
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
    } else if (
      occurrenceTiming.repeat.frequency === 1 &&
      occurrenceTiming.repeat.period &&
      occurrenceTiming.repeat.period > 1
    ) {
      words.push(translateEvery(occurrenceTiming, language));
      words.push(occurrenceTiming.repeat.period);
      words.push(translateTimeUnit(occurrenceTiming.repeat.period, occurrenceTiming.repeat.periodUnit, language));
    } else if (
      occurrenceTiming.repeat.frequency > 1 &&
      occurrenceTiming.repeat.period &&
      occurrenceTiming.repeat.period > 1
    ) {
      words.push(occurrenceTiming.repeat.frequency);
      words.push(translations.timesPer[language]);
      words.push(occurrenceTiming.repeat.period);
      words.push(translateTimeUnit(occurrenceTiming.repeat.period, occurrenceTiming.repeat.periodUnit, language));
    }
  }
  return words.join(' ');
}

function translateEvery(occurrenceTiming: OccurrenceTiming, language: 'nl' | 'fr'): string {
  const gender =
    occurrenceTiming.repeat.periodUnit && ['d', 'mo', 'a'].includes(occurrenceTiming.repeat.periodUnit)
      ? 'masculine'
      : 'feminine';
  return translations.every[gender][language];
}

export function translateDayOfWeek(occurrenceTiming: OccurrenceTiming, language: 'nl' | 'fr'): string {
  const words = [];
  if (occurrenceTiming.repeat.dayOfWeek?.length) {
    const translatedDays = occurrenceTiming.repeat.dayOfWeek.map(d => translations.weekdays[d]?.[language] || d);
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

export function translateBoundsDuration(occurrenceTiming: OccurrenceTiming, language: 'nl' | 'fr'): string {
  const words = [];
  if (occurrenceTiming.repeat.boundsDuration) {
    words.push(translations.during[language]);
    words.push(occurrenceTiming.repeat.boundsDuration.value);
    if (occurrenceTiming.repeat.boundsDuration.code) {
      words.push(
        translateTimeUnit(
          occurrenceTiming.repeat.boundsDuration.value,
          occurrenceTiming.repeat.boundsDuration.code,
          language
        )
      );
    }
  }
  return words.join(' ');
}

export function translateDuration(occurrenceTiming: OccurrenceTiming, language: 'nl' | 'fr'): string {
  const words = [];
  if (!occurrenceTiming.repeat.duration) return '';
  else {
    words.push(translations.sessionDuration[language]);
    words.push(occurrenceTiming.repeat.duration);
    if (occurrenceTiming.repeat.durationUnit) {
      words.push(translateTimeUnit(occurrenceTiming.repeat.duration, occurrenceTiming.repeat.durationUnit, language));
    }
  }
  return words.join(' ');
}

export function translateTimeUnit(unit = 1, unitOfTime?: UnitsOfTime, language: 'nl' | 'fr' = 'nl'): string {
  const oneOrMultiple = unit !== 1 ? 'multiple' : 'one';
  return unitOfTime ? translations.unitsOfTime[oneOrMultiple][unitOfTime]?.[language] || unitOfTime : '';
}

export function validateOccurrenceTiming(input: any): input is OccurrenceTiming {
  if (!input || typeof input !== 'object') return false;

  const repeat = input.repeat;
  if (!repeat || typeof repeat !== 'object') return false;

  const { frequency, period, periodUnit, duration, durationUnit, dayOfWeek, boundsDuration } = repeat;

  if (frequency !== undefined && typeof frequency !== 'number') return false;
  if (period !== undefined && typeof period !== 'number') return false;
  if (periodUnit !== undefined && !isValidUnitOfTime(periodUnit)) return false;

  if (duration !== undefined && typeof duration !== 'number') return false;
  if (durationUnit !== undefined && !isValidUnitOfTime(durationUnit)) return false;

  if (dayOfWeek !== undefined && !Array.isArray(dayOfWeek)) return false;
  if (dayOfWeek && !dayOfWeek.every((d: unknown) => isValidWeekday(d))) return false;

  if (boundsDuration !== undefined) {
    if (typeof boundsDuration !== 'object') return false;
    if (typeof boundsDuration.value !== 'number') return false;
    if (!isValidUnitOfTime(boundsDuration.code)) return false;
    if (typeof boundsDuration.system !== 'string') return false;
  }

  return true;
}

function isValidUnitOfTime(value: any): value is UnitsOfTime {
  return ['s', 'min', 'h', 'd', 'wk', 'mo', 'a'].includes(value);
}

function isValidWeekday(value: any): value is Weekday {
  return ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].includes(value);
}

export function isOccurrenceTiming(value: unknown): value is OccurrenceTiming {
  return typeof value === 'object' && value !== null && 'repeat' in value;
}

export function setOccurrenceTimingResponses(initialPrescription: ReadRequestResource): void {
  const responses = initialPrescription.responses;
  if (!responses) return;

  const rawTiming = responses?.['occurrenceTiming'];
  if (!rawTiming) return;

  const occurrenceTiming = isOccurrenceTiming(rawTiming) ? rawTiming : undefined;
  if (!occurrenceTiming) return;

  if (
    occurrenceTiming.repeat.boundsDuration?.value != undefined &&
    occurrenceTiming.repeat.boundsDuration.code != undefined
  ) {
    responses['boundsDuration'] = occurrenceTiming.repeat.boundsDuration.value;
    responses['boundsDurationUnit'] = occurrenceTiming.repeat.boundsDuration.code;
  }

  if (occurrenceTiming.repeat.duration != undefined && occurrenceTiming.repeat.durationUnit != undefined) {
    responses['sessionDuration'] = occurrenceTiming.repeat.duration;
    responses['sessionDurationUnit'] = occurrenceTiming.repeat.durationUnit;
  }

  if (occurrenceTiming.repeat.dayOfWeek != undefined) {
    responses['dayOfWeek'] = occurrenceTiming.repeat.dayOfWeek;
  }
}
