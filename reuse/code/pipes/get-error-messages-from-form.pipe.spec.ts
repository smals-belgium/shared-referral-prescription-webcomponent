import { GetErrorMessagesFromFormPipe } from '@reuse/code/pipes/get-error-messages-from-form.pipe';

const mockTemplate = {
  elements: [
    {
      id: 'frequencyRow',
      labelTranslationId: 'frequencyRowLabel',
      elements: [{ id: 'frequency', labelTranslationId: 'frequencyLabel' }, { id: 'period' }],
    },
    { id: 'notes', labelTranslationId: 'notesLabel' },
  ],
};
describe('GetErrorMessagesFromFormPipe', () => {
  let pipe: GetErrorMessagesFromFormPipe;

  beforeEach(() => {
    pipe = new GetErrorMessagesFromFormPipe();
  });

  it('should return empty array when template has no elements', () => {
    expect(pipe.transform({ frequency: true }, undefined)).toEqual([]);
    expect(pipe.transform({ frequency: true }, {} as any)).toEqual([]);
  });

  it('should return label and id for matched elements', () => {
    const result = pipe.transform({ frequency: true, notes: true }, mockTemplate as any);
    expect(result).toEqual([
      { label: 'frequencyLabel', id: 'frequency' },
      { label: 'notesLabel', id: 'notes' },
    ]);
  });

  it('should inherit labelTranslationId from parent when child has none', () => {
    const result = pipe.transform({ period: true }, mockTemplate as any);
    expect(result).toEqual([{ label: 'frequencyRowLabel', id: 'period' }]);
  });

  it('should deduplicate entries sharing the same labelTranslationId', () => {
    const templateWithSharedLabel = {
      elements: [
        {
          id: 'frequencyRow',
          labelTranslationId: 'sharedLabel',
          elements: [{ id: 'fieldA' }, { id: 'fieldB' }],
        },
      ],
    };
    const result = pipe.transform({ fieldA: true, fieldB: true }, templateWithSharedLabel as any);
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe('sharedLabel');
  });
});
