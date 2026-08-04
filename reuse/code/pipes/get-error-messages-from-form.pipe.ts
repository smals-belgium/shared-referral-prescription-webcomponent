import { Pipe, PipeTransform } from '@angular/core';
import { FormElement, TemplateVersion } from '@reuse/code/openapi';

interface ErrorMessage {
  label: string;
  id?: string;
}

@Pipe({
  name: 'getErrorMessagesFromForm',
  standalone: true,
  pure: true,
})
export class GetErrorMessagesFromFormPipe implements PipeTransform {
  transform(errors: Record<string, unknown>, template?: TemplateVersion): ErrorMessage[] {
    if (!template?.elements) return [];

    const evfLabels = new Set();

    //Iterates over each key in `errors`, resolves the corresponding form element in the template.
    const uniqueErrors = Object.keys(errors).flatMap(key => {
      const element = template.elements && this.findElement(template.elements, key);
      if (!element?.labelTranslationId) return [];

      // Elements that share the same `labelTranslationId` are collapsed into a single entry, so a repeated label is never surfaced more than once.
      // e.g. when multiple fields inside a row share a row-level label (boundsduration).
      if (evfLabels.has(element.labelTranslationId)) return [];
      evfLabels.add(element.labelTranslationId);

      return [{ label: element.labelTranslationId, id: element.id }];
    });

    return uniqueErrors;
  }

  private readonly findElement = (
    elements: FormElement[],
    id: string,
    inheritedLabelId?: string
  ): FormElement | undefined => {
    for (const element of elements) {
      // The label-inheritance mechanism ensures that deeply nested elements (e.g. boundsduration) can still be associated with a meaningful label even when they carry no `labelTranslationId` themselves.
      const closestLabelId = element.labelTranslationId ?? inheritedLabelId;

      if (element.id === id) {
        return { ...element, labelTranslationId: closestLabelId };
      }

      if (element.elements?.length) {
        const found = this.findElement(element.elements, id, closestLabelId);
        if (found) return found;
      }
    }
    return undefined;
  };
}
