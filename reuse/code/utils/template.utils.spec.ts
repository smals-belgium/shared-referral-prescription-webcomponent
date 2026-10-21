import { flattenElements, isCodeIn, templateIdsAreEqual, templateIdToString } from './template.utils';
import { FormElement } from '@smals-belgium-shared/vas-evaluation-form-ui-core';

const parametersTemplate = {
  create: true,
  snomed: '182777000',
  codeSystemUrl: 'http://snomed.info/sct',
};
const diabeticTemplate = {
  create: true,
  snomed: '385805005',
  orderDetail: 'tmp-with-tion-7',
  codeSystemUrl: 'http://snomed.info/sct',
  orderDetailSystemUrl:
    'https://www.ehealth.fgov.be/standards/fhir/referral/CodeSystem/be-cs-temp-requested-service-detail',
};

describe('TemplateUtils', () => {
  it('should return the correct templateId', () => {
    let templateId = templateIdToString(parametersTemplate);
    expect(templateId).toBe('182777000');

    templateId = templateIdToString(diabeticTemplate);
    expect(templateId).toBe('385805005/tmp-with-tion-7');
  });

  it('should return true when the templates are equal', () => {
    let equal = templateIdsAreEqual(parametersTemplate, parametersTemplate);
    expect(equal).toBe(true);

    equal = templateIdsAreEqual(parametersTemplate, diabeticTemplate);
    expect(equal).toBe(false);
  });

  it('should flatter responses', () => {
    const formElement: FormElement[] = [
      {
        id: 'occurrenceTiming',
        dataType: {
          type: 'object',
        },
        viewType: 'occurrenceTiming',
        labelTranslationId: 'frequencyRow',
      },
      {
        id: 'nbSessions',
        dataType: {
          type: 'number',
        },
        viewType: 'number',
        labelTranslationId: 'nbSessions',
        placeholderTranslationId: 'nbSessionsPlaceholder',
      },
    ];

    const flatteredResponse = [
      {
        dataType: {
          type: 'object',
        },
        id: 'occurrenceTiming',
        labelTranslationId: 'frequencyRow',
        viewType: 'occurrenceTiming',
      },
      {
        dataType: {
          type: 'object',
        },
        id: 'occurrenceTiming',
        labelTranslationId: 'frequencyRow',
        viewType: 'occurrenceTiming',
      },
      {
        dataType: {
          type: 'number',
        },
        id: 'nbSessions',
        labelTranslationId: 'nbSessions',
        placeholderTranslationId: 'nbSessionsPlaceholder',
        viewType: 'number',
      },
    ];
    const flatteredElement = flattenElements(formElement);
    expect(flatteredElement).toEqual(flatteredResponse);
  });

  it('should check if code is in codes', () => {
    const code = 'annex_81';
    const codes = {
      annex_81: 'annex_81',
      annex_82: 'annex_82',
    };
    expect(isCodeIn(codes, code)).toBe(true);
    expect(isCodeIn(codes, 'notInCodes')).toBe(false);
  });
});
