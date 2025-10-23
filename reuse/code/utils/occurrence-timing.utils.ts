import { BoundsDuration, OccurrenceTiming, Repeat, UnitsOfTime, Weekday } from '@reuse/code/interfaces';
import { ReadRequestResource, Translation } from '@reuse/code/openapi';

type TranslationType = keyof Translation;
const translations = {
  every: {
    masculine: {
      nl: 'Elke',
      fr: 'Tous les',
      de: 'TO BE DEFINED',
      en: 'TO BE DEFINED',
    },
    feminine: {
      nl: 'Elke',
      fr: 'Toutes les',
      de: 'TO BE DEFINED',
      en: 'TO BE DEFINED',
    },
  },
  timesPer: {
    nl: 'keer per',
    fr: 'fois par',
    de: 'TO BE DEFINED',
    en: 'TO BE DEFINED',
  },
  on: {
    nl: 'op',
    fr: 'le',
    de: 'TO BE DEFINED',
    en: 'TO BE DEFINED',
  },
  and: {
    nl: 'en',
    fr: 'et',
    de: 'TO BE DEFINED',
    en: 'TO BE DEFINED',
  },
  sessionDuration: {
    nl: 'een sessie van',
    fr: 'une séance de',
    de: 'TO BE DEFINED',
    en: 'TO BE DEFINED',
  },
  during: {
    nl: 'gedurende',
    fr: 'durant',
    de: 'TO BE DEFINED',
    en: 'TO BE DEFINED',
  },
  unitsOfTime: {
    one: {
      s: {
        nl: 'seconde',
        fr: 'seconde',
        de: 'TO BE DEFINED',
        en: 'TO BE DEFINED',
      },
      min: {
        nl: 'minuut',
        fr: 'minute',
        de: 'TO BE DEFINED',
        en: 'TO BE DEFINED',
      },
      h: {
        nl: 'uur',
        fr: 'heure',
        de: 'TO BE DEFINED',
        en: 'TO BE DEFINED',
      },
      d: {
        nl: 'dag',
        fr: 'jour',
        de: 'TO BE DEFINED',
        en: 'TO BE DEFINED',
      },
      wk: {
        nl: 'week',
        fr: 'semaine',
        de: 'TO BE DEFINED',
        en: 'TO BE DEFINED',
      },
      mo: {
        nl: 'maand',
        fr: 'mois',
        de: 'TO BE DEFINED',
        en: 'TO BE DEFINED',
      },
      a: {
        nl: 'jaar',
        fr: 'an',
        de: 'TO BE DEFINED',
        en: 'TO BE DEFINED',
      },
    },
    multiple: {
      s: {
        nl: 'seconden',
        fr: 'secondes',
        de: 'TO BE DEFINED',
        en: 'TO BE DEFINED',
      },
      min: {
        nl: 'minuten',
        fr: 'minutes',
        de: 'TO BE DEFINED',
        en: 'TO BE DEFINED',
      },
      h: {
        nl: 'uren',
        fr: 'heures',
        de: 'TO BE DEFINED',
        en: 'TO BE DEFINED',
      },
      d: {
        nl: 'dagen',
        fr: 'jours',
        de: 'TO BE DEFINED',
        en: 'TO BE DEFINED',
      },
      wk: {
        nl: 'weken',
        fr: 'semaines',
        de: 'TO BE DEFINED',
        en: 'TO BE DEFINED',
      },
      mo: {
        nl: 'maanden',
        fr: 'mois',
        de: 'TO BE DEFINED',
        en: 'TO BE DEFINED',
      },
      a: {
        nl: 'jaren',
        fr: 'ans',
        de: 'TO BE DEFINED',
        en: 'TO BE DEFINED',
      },
    },
  },
  weekdays: {
    mon: {
      nl: 'maandag',
      fr: 'lundi',
      de: 'TO BE DEFINED',
      en: 'TO BE DEFINED',
    },
    tue: {
      nl: 'dinsdag',
      fr: 'mardi',
      de: 'TO BE DEFINED',
      en: 'TO BE DEFINED',
    },
    wed: {
      nl: 'woensdag',
      fr: 'mercredi',
      de: 'TO BE DEFINED',
      en: 'TO BE DEFINED',
    },
    thu: {
      nl: 'donderdag',
      fr: 'jeudi',
      de: 'TO BE DEFINED',
      en: 'TO BE DEFINED',
    },
    fri: {
      nl: 'vrijdag',
      fr: 'vendredi',
      de: 'TO BE DEFINED',
      en: 'TO BE DEFINED',
    },
    sat: {
      nl: 'zaterdag',
      fr: 'samedi',
      de: 'TO BE DEFINED',
      en: 'TO BE DEFINED',
    },
    sun: {
      nl: 'zondag',
      fr: 'dimanche',
      de: 'TO BE DEFINED',
      en: 'TO BE DEFINED',
    },
  },
};

export function translateOccurrenceTiming(occurrenceTiming: OccurrenceTiming, language: TranslationType): string {
  const words = [];
  const frequencyAndPeriod = translateFrequencyAndPeriod(occurrenceTiming.repeat, language);
  const dayOfWeek = translateDayOfWeek(occurrenceTiming, language);
  const duration = translateDuration(occurrenceTiming, language);
  const boundsDuration = occurrenceTiming.repeat.boundsDuration
    ? translateOccurencyDuration(occurrenceTiming, language)
    : '';
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

export function translateFrequencyAndPeriod(repeat: Repeat, language: keyof Translation): string {
  const words = [];
  if (repeat?.frequency && repeat?.frequency > 0) {
    if (repeat.frequency > 1 && repeat.period === 1) {
      words.push(repeat.frequency);
      words.push(translations.timesPer[language]);
      words.push(translateTimeUnit(repeat.period, repeat.periodUnit, language));
    } else if (repeat.frequency === 1 && repeat.period === 1) {
      words.push(translateEvery(repeat, language));
      words.push(translateTimeUnit(language === 'fr' ? 2 : 1, repeat.periodUnit, language));
    } else if (repeat.frequency === 1 && repeat.period && repeat.period > 1) {
      words.push(translateEvery(repeat, language));
      words.push(repeat.period);
      words.push(translateTimeUnit(repeat.period, repeat.periodUnit, language));
    } else if (repeat.frequency > 1 && repeat.period && repeat.period > 1) {
      words.push(repeat.frequency);
      words.push(translations.timesPer[language]);
      words.push(repeat.period);
      words.push(translateTimeUnit(repeat.period, repeat.periodUnit, language));
    }
  }
  return words.join(' ');
}

function translateEvery(repeat: Repeat, language: TranslationType): string {
  const gender = repeat.periodUnit && ['d', 'mo', 'a'].includes(repeat.periodUnit) ? 'masculine' : 'feminine';
  return translations.every[gender][language];
}

export function translateDayOfWeek(occurrenceTiming: OccurrenceTiming, language: TranslationType): string {
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

export function translateOccurencyDuration(
  occurrenceTiming: OccurrenceTiming,
  language: 'nl' | 'fr' | 'en' | 'de'
): string {
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

export function translateBoundsDuration(boundsDuration: BoundsDuration, language: TranslationType): string {
  const words = [];
  if (boundsDuration) {
    words.push(boundsDuration.value);
    if (boundsDuration.code) {
      words.push(translateTimeUnit(boundsDuration.value, boundsDuration.code, language));
    }
  }
  return words.join(' ');
}

export function translateDuration(occurrenceTiming: OccurrenceTiming, language: TranslationType): string {
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

export function translateTimeUnit(unit = 1, unitOfTime?: UnitsOfTime, language: TranslationType = 'nl'): string {
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

export function validateOccurences(repeat?: Repeat) {
  if (!repeat) return false;

  const { frequency, period, periodUnit } = repeat;

  if (frequency !== undefined && typeof frequency !== 'number') return false;
  if (period !== undefined && typeof period !== 'number') return false;
  if (periodUnit !== undefined && !isValidUnitOfTime(periodUnit)) return false;

  return true;
}

export function validateBoundsDuration(boundsDuration?: BoundsDuration) {
  if (!boundsDuration) return false;

  if (typeof boundsDuration !== 'object') return false;
  if (typeof boundsDuration.value !== 'number') return false;
  if (!isValidUnitOfTime(boundsDuration.code)) return false;
  if (typeof boundsDuration.system !== 'string') return false;

  return true;
}

function isValidUnitOfTime(value: unknown): value is UnitsOfTime {
  return typeof value === 'string' && ['s', 'min', 'h', 'd', 'wk', 'mo', 'a'].includes(value);
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
