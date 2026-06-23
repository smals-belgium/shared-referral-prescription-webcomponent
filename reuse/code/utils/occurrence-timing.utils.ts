import { BoundsDuration, OccurrenceTiming, Repeat, UnitsOfTime, Weekday } from '@reuse/code/interfaces';
import { ReadRequestResource, Translation } from '@reuse/code/openapi';
import { Language } from '@smals-belgium-shared/vas-evaluation-form-ui-core';
import { Lang } from '@reuse/code/constants/languages';

type TranslationType = keyof Translation;
const translations = {
  every: {
    masculine: {
      nl: 'Elke',
      fr: 'Tous les',
      de: 'Jeden',
      en: 'Every',
    },
    feminine: {
      nl: 'Elke',
      fr: 'Toutes les',
      de: 'Jede',
      en: 'Every',
    },
  },
  timesPer: {
    nl: 'keer per',
    fr: 'fois par',
    de: 'mal pro',
    en: 'times per',
  },
  on: {
    nl: 'op',
    fr: 'le',
    de: 'am',
    en: 'on',
  },
  and: {
    nl: 'en',
    fr: 'et',
    de: 'und',
    en: 'and',
  },
  sessionDuration: {
    nl: 'een sessie van',
    fr: 'une séance de',
    de: 'eine Sitzung von',
    en: 'a session of',
  },
  during: {
    nl: 'gedurende',
    fr: 'durant',
    de: 'während',
    en: 'during',
  },
  unitsOfTime: {
    one: {
      s: {
        nl: 'seconde',
        fr: 'seconde',
        de: 'Sekunde',
        en: 'second',
      },
      min: {
        nl: 'minuut',
        fr: 'minute',
        de: 'Minute',
        en: 'minute',
      },
      h: {
        nl: 'uur',
        fr: 'heure',
        de: 'Stunde',
        en: 'hour',
      },
      d: {
        nl: 'dag',
        fr: 'jour',
        de: 'Tag',
        en: 'day',
      },
      wk: {
        nl: 'week',
        fr: 'semaine',
        de: 'Woche',
        en: 'week',
      },
      mo: {
        nl: 'maand',
        fr: 'mois',
        de: 'Monat',
        en: 'month',
      },
      a: {
        nl: 'jaar',
        fr: 'an',
        de: 'Jahr',
        en: 'year',
      },
    },
    multiple: {
      s: {
        nl: 'seconden',
        fr: 'secondes',
        de: 'Sekunden',
        en: 'seconds',
      },
      min: {
        nl: 'minuten',
        fr: 'minutes',
        de: 'Minuten',
        en: 'minutes',
      },
      h: {
        nl: 'uren',
        fr: 'heures',
        de: 'Stunden',
        en: 'hours',
      },
      d: {
        nl: 'dagen',
        fr: 'jours',
        de: 'Tage',
        en: 'days',
      },
      wk: {
        nl: 'weken',
        fr: 'semaines',
        de: 'Wochen',
        en: 'weeks',
      },
      mo: {
        nl: 'maanden',
        fr: 'mois',
        de: 'Monate',
        en: 'months',
      },
      a: {
        nl: 'jaren',
        fr: 'ans',
        de: 'Jahre',
        en: 'years',
      },
    },
  },
  weekdays: {
    mon: {
      nl: 'maandag',
      fr: 'lundi',
      de: 'Montag',
      en: 'Monday',
    },
    tue: {
      nl: 'dinsdag',
      fr: 'mardi',
      de: 'Dienstag',
      en: 'Tuesday',
    },
    wed: {
      nl: 'woensdag',
      fr: 'mercredi',
      de: 'Mittwoch',
      en: 'Wednesday',
    },
    thu: {
      nl: 'donderdag',
      fr: 'jeudi',
      de: 'Donnerstag',
      en: 'Thursday',
    },
    fri: {
      nl: 'vrijdag',
      fr: 'vendredi',
      de: 'Freitag',
      en: 'Friday',
    },
    sat: {
      nl: 'zaterdag',
      fr: 'samedi',
      de: 'Samstag',
      en: 'Saturday',
    },
    sun: {
      nl: 'zondag',
      fr: 'dimanche',
      de: 'Sonntag',
      en: 'Sunday',
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
      words.push(
        repeat.frequency,
        translations.timesPer[language],
        translateTimeUnit(repeat.period, repeat.periodUnit, language)
      );
    } else if (repeat.frequency === 1 && repeat.period === 1) {
      words.push(
        translateEvery(repeat, language),
        translateTimeUnit(language === Lang.FR.short ? 2 : 1, repeat.periodUnit, language)
      );
    } else if (repeat.frequency === 1 && repeat.period && repeat.period > 1) {
      words.push(
        translateEvery(repeat, language),
        repeat.period,
        translateTimeUnit(repeat.period, repeat.periodUnit, language)
      );
    } else if (repeat.frequency > 1 && repeat.period && repeat.period > 1) {
      words.push(
        repeat.frequency,
        translations.timesPer[language],
        repeat.period,
        translateTimeUnit(repeat.period, repeat.periodUnit, language)
      );
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
      words.push(translatedDays.join(', '), translations.and[language]);
    }
    words.push(last);
  }
  return words.join(' ');
}

export function translateOccurencyDuration(occurrenceTiming: OccurrenceTiming, language: Language): string {
  const words = [];
  if (occurrenceTiming.repeat.boundsDuration) {
    words.push(translations.during[language], occurrenceTiming.repeat.boundsDuration.value);
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
    words.push(translations.sessionDuration[language], occurrenceTiming.repeat.duration);
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
  if (!isRecord(input)) return false;

  if (!isRecord(input['repeat'])) return false;
  const repeat = input['repeat'] as Repeat;

  if (!isOptionalNumber(repeat.frequency)) return false;
  if (!isOptionalNumber(repeat.period)) return false;
  if (!isOptionalUnit(repeat.periodUnit)) return false;

  if (!isOptionalNumber(repeat.duration)) return false;
  if (!isOptionalUnit(repeat.durationUnit)) return false;

  if (!isOptionalWeekdays(repeat.dayOfWeek)) return false;

  const bd = repeat.boundsDuration;

  if (bd !== undefined) {
    if (
      typeof bd !== 'object' ||
      typeof bd.value !== 'number' ||
      !isValidUnitOfTime(bd.code) ||
      typeof bd.system !== 'string'
    ) {
      return false;
    }
  }

  return true;
}

/**
 * helpers
 *
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isOptionalNumber(value: unknown): boolean {
  return value === undefined || typeof value === 'number';
}

function isOptionalUnit(value: unknown): boolean {
  return value === undefined || isValidUnitOfTime(value);
}

function isOptionalWeekdays(value: unknown): boolean {
  return value === undefined || (Array.isArray(value) && value.every(isValidWeekday));
}

/**
 * end helpers
 */

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
