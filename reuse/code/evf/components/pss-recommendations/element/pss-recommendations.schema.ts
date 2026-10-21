import { EvfElementSchema } from '@smals-belgium-shared/vas-evaluation-form-ui-core';

export const schema: EvfElementSchema = {
  defaultValue: true,
  displayName: 'Pss Recommendations',
  labels: {
    label: true,
  },
  responses: true,
  dataTypes: [{ type: 'autocomplete' }],
  subElements: true,
  validations: {
    required: true,
  },
  viewType: 'pssRecommendations',
};
