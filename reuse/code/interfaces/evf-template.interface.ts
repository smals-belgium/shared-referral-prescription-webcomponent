import { FormTranslation } from '@smals/vas-evaluation-form-ui-core';

export interface EvfTemplate {
  code: string;
  labelTranslations: FormTranslation;
  metadata: {
    snomed: string;
    orderDetail?: string;
  };
}
