import { CheckboxListComponent } from '@smals-belgium-shared/vas-evaluation-form-ui-material/elements/checkbox-list';
import { CustomCheckboxListComponent } from './custom-checkbox-list.component';

describe('CustomCheckboxListComponent', () => {
  it('should extend CheckboxListComponent', () => {
    expect(Object.getPrototypeOf(CustomCheckboxListComponent.prototype)).toBe(CheckboxListComponent.prototype);
  });

  it('should keep standalone component metadata', () => {
    const cmp = (CustomCheckboxListComponent as any).ɵcmp;

    expect(cmp).toBeDefined();
    expect(cmp.standalone).toBe(true);
    expect(cmp.selectors).toEqual([['evf-custom-checkbox-list']]);
  });
});
