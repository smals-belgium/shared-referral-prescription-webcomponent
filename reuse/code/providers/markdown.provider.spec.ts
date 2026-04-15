import { Tokens } from 'marked';
import { markedOptionsFactory } from './markdown.provider';

describe('markedOptionsFactory', () => {
  const { renderer } = markedOptionsFactory({ open: false });

  const paragraph = (text: string): Tokens.Paragraph => ({
    type: 'paragraph',
    raw: text,
    text,
    tokens: [{ type: 'text', raw: text, text } as Tokens.Text],
  });

  const list = (): Tokens.List => ({
    type: 'list',
    raw: '- item',
    ordered: false,
    start: '',
    loose: false,
    items: [
      {
        type: 'list_item',
        raw: '- item',
        task: false,
        checked: undefined,
        loose: false,
        text: 'item',
        tokens: [],
      },
    ],
  });

  it('renders collapsible details when paragraph is followed by more tokens', () => {
    const result = renderer?.blockquote({ tokens: [paragraph('My title'), list()] } as any);

    expect(result).toContain('evf-infoblock-summary');
    expect(result).toContain('<details');
    expect(result).toContain('<summary class="title">My title</summary>');
    expect(result).toContain('<div class="body">');
  });

  it('falls back to plain infoblock when the first token is not a paragraph', () => {
    const result = renderer?.blockquote({ tokens: [list(), paragraph('Last item is a paragraph')] } as any);

    expect(result).toContain('evf-infoblock"');
    expect(result).not.toContain('<details');
  });

  it('falls back to plain infoblock when there is only a paragraph', () => {
    const result = renderer?.blockquote({ tokens: [paragraph('Only title')] } as any);

    expect(result).toContain('evf-infoblock"');
    expect(result).not.toContain('<details');
  });

  it('falls back to plain infoblock when there is no paragraph token', () => {
    const result = renderer?.blockquote({ tokens: [list()] } as any);

    expect(result).toContain('evf-infoblock"');
    expect(result).not.toContain('<details');
  });

  it('strips wrapping <p> tags from the summary title', () => {
    const result = renderer?.blockquote({ tokens: [paragraph('Clean title'), list()] } as any);

    expect(result).not.toMatch(/<summary[^>]*><p>/);
    expect(result).not.toMatch(/<\/p><\/summary>/);
  });

  it('renders bold markdown in title as <strong>', () => {
    const bold: Tokens.Paragraph = {
      type: 'paragraph',
      raw: '**Important** title',
      text: '**Important** title',
      tokens: [
        {
          type: 'strong',
          raw: '**Important**',
          text: 'Important',
          tokens: [{ type: 'text', raw: 'Important', text: 'Important' } as Tokens.Text],
        } as Tokens.Strong,
        { type: 'text', raw: ' title', text: ' title' } as Tokens.Text,
      ],
    };

    const result = renderer?.blockquote({ tokens: [bold, list()] } as any);

    expect(result).toContain('<strong>Important</strong>');
  });
});
