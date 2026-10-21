import { SupportOption } from '@reuse/code/openapi';

export const PSS_ERROR_SCORE = 4;
export const PSS_WARNING_SCORE = 6;
export const PSS_SUCCESS_SCORE = 7;
export const PSS_ONE_SCORE = 1;
export const PSS_ZERO_SCORE = 0;

export const PSS_OTHER_REASON = 'OtherReason';
export const PSS_NO_EXAMINATION = 'noExamination';

export const PSS_DEFAULT_INDICATIONS: SupportOption[] = [
  {
    id: PSS_OTHER_REASON,
    score: 0,
    supportOptionMetadata: { labelTranslationId: PSS_OTHER_REASON },
  },
  {
    id: PSS_NO_EXAMINATION,
    score: -1,
    supportOptionMetadata: { labelTranslationId: PSS_NO_EXAMINATION },
  },
];
