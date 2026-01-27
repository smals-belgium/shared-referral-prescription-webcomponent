import { TemplateId } from '@reuse/code/interfaces';
import { FormElement } from '@smals-belgium-shared/vas-evaluation-form-ui-core';

export function templateIdToString(templateId: TemplateId): string {
  return templateId.orderDetail ? `${templateId.snomed}/${templateId.orderDetail}` : templateId.snomed;
}

export function templateIdsAreEqual(templateId1: TemplateId, templateId2: TemplateId): boolean {
  return templateId1.snomed === templateId2.snomed && templateId1.orderDetail == templateId2.orderDetail;
}

export function flattenElements(elements?: FormElement[]): FormElement[] {
  if (!elements) {
    return [];
  }
  return elements.reduce((acc: FormElement[], cur: FormElement) => {
    if (cur.dataType) {
      acc.push({
        ...cur,
        elements: undefined,
      });
    }
    if (cur.viewType === 'occurrenceTiming') {
      acc.push(cur);
    }
    if (cur.dataType?.type !== 'repeatable' && cur.viewType !== 'occurrenceTiming') {
      acc.push(...flattenElements(cur.elements));
    }
    return acc;
  }, [] as FormElement[]);
}
