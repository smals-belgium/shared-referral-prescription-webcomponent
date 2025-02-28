import { FormTranslation } from '@smals/vas-evaluation-form-ui-core';

export interface EvfTemplate {
  code: string;
  id: number;
  labelTranslations: FormTranslation;
  metadata: {
    snomed: string;
    orderDetail?: string;
  };
}
