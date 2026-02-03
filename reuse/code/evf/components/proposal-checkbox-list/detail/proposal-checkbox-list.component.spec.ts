import { ChangeDetectorRef, SimpleChange, SimpleChanges } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { ProposalCheckboxListComponent } from './proposal-checkbox-list.component';

describe('ProposalCheckboxListComponent', () => {
  let component: ProposalCheckboxListComponent;

  const createMockElementControl = (value: unknown[] = [], responses: unknown[] = []) => ({
    value,
    valueChanges: new BehaviorSubject(value),
    responses$: new BehaviorSubject(responses),
    childElementControls: [] as any[],
  });

  const createMockElement = (responses: any[] = []) => ({
    responses,
    labelTranslationId: 'test.label',
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ProposalCheckboxListComponent,
        { provide: ChangeDetectorRef, useValue: { markForCheck: jest.fn(), detectChanges: jest.fn() } },
      ],
    });

    component = TestBed.inject(ProposalCheckboxListComponent);
    component.options = {
      showLabel: true,
    };
  });

  const setElement = (element: any) => {
    Object.defineProperty(component, 'element', {
      get: () => element,
      configurable: true,
    });
  };

  const setElementControl = (control: any) => {
    Object.defineProperty(component, 'elementControl', {
      get: () => control,
      configurable: true,
    });
  };

  describe('ngOnChanges', () => {
    it('should call setResponses when elementControl changes and element exists', () => {
      const responses = [{ value: 'a', labelTranslationId: 'label.a' }];
      const elementControl = createMockElementControl(['a']);

      setElement(createMockElement(responses));
      setElementControl(elementControl);

      const changes: SimpleChanges = {
        elementControl: new SimpleChange(null, elementControl, true),
      };

      component.ngOnChanges(changes);

      expect(component.selectedResponses$).toBeDefined();
    });

    it('should not set selectedResponses$ when element is undefined', () => {
      const elementControl = createMockElementControl();

      setElement(undefined);
      setElementControl(elementControl);
      component.selectedResponses$ = undefined;

      const changes: SimpleChanges = {
        elementControl: new SimpleChange(null, elementControl, true),
      };

      component.ngOnChanges(changes);

      expect(component.selectedResponses$).toBeUndefined();
    });
  });

  describe('selectedResponses$', () => {
    it('should emit filtered responses matching selected values', async () => {
      const responses = [
        { value: 'a', labelTranslationId: 'label.a' },
        { value: 'b', labelTranslationId: 'label.b' },
        { value: 'c', labelTranslationId: 'label.c' },
      ];
      const elementControl = createMockElementControl(['a', 'c']);

      setElement(createMockElement(responses));
      setElementControl(elementControl);

      component.ngOnChanges({
        elementControl: new SimpleChange(null, elementControl, true),
      });

      const result = await firstValueFrom(component.selectedResponses$!);

      expect(result).toHaveLength(2);
      expect(result[0].response.value).toBe('a');
      expect(result[1].response.value).toBe('c');
    });

    it('should return empty array when element.responses is undefined', async () => {
      const elementControl = createMockElementControl(['a']);

      setElement(createMockElement(undefined));
      setElementControl(elementControl);

      component.ngOnChanges({
        elementControl: new SimpleChange(null, elementControl, true),
      });

      const result = await firstValueFrom(component.selectedResponses$!);

      expect(result).toEqual([]);
    });

    it('should include matching subElementsControls for each response', async () => {
      const responses = [{ value: 'a', labelTranslationId: 'label.a' }];
      const childControl = { element: { showIfParentResponse: ['a'] } };
      const elementControl = createMockElementControl(['a']);
      elementControl.childElementControls = [childControl];

      setElement(createMockElement(responses));
      setElementControl(elementControl);

      component.ngOnChanges({
        elementControl: new SimpleChange(null, elementControl, true),
      });

      const result = await firstValueFrom(component.selectedResponses$!);

      expect(result[0].subElementsControls).toContain(childControl);
    });
  });

  describe('getSubElementControls', () => {
    it('should return controls matching the given parent response value', () => {
      const matchingControl = { element: { showIfParentResponse: ['selected'] } };
      const nonMatchingControl = { element: { showIfParentResponse: ['other'] } };
      const elementControl = createMockElementControl();
      elementControl.childElementControls = [matchingControl, nonMatchingControl];

      setElementControl(elementControl);

      const result = component.getSubElementControls('selected');

      expect(result).toEqual([matchingControl]);
    });

    it('should return empty array when no controls match', () => {
      const elementControl = createMockElementControl();
      elementControl.childElementControls = [{ element: { showIfParentResponse: ['other'] } }];

      setElementControl(elementControl);

      const result = component.getSubElementControls('nonexistent');

      expect(result).toEqual([]);
    });
  });

  describe('isChecked', () => {
    it('should return true when value is in elementControl.value', () => {
      setElementControl(createMockElementControl(['a', 'b']));

      expect(component.isChecked('a')).toBe(true);
    });

    it('should return false when value is not in elementControl.value', () => {
      setElementControl(createMockElementControl(['a', 'b']));

      expect(component.isChecked('c')).toBe(false);
    });
  });
});
