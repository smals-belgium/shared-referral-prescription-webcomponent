import { Language } from '@smals-belgium-shared/vas-evaluation-form-ui-core';
import { Lang } from '@reuse/code/constants/languages';

export type SupportedLanguages = Extract<Language, 'nl' | 'fr'>;

export function formatToEvfLangCode(localeCode: string): SupportedLanguages {
  return (localeCode?.substring(0, 2) as SupportedLanguages) ?? Lang.FR.short;
}

export interface StepperStepChangedData {
  uniqueId: number;
  lastStep: boolean;
}

export function isStepperStepChangedData(data: unknown): data is StepperStepChangedData {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as Record<string, unknown>)['uniqueId'] === 'number' &&
    typeof (data as Record<string, unknown>)['lastStep'] === 'boolean'
  );
}
