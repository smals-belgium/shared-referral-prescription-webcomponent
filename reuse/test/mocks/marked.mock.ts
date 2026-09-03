type Token = {
  type: string;
  text?: string;
  tokens?: Token[];
};

function renderToken(token: Token): string {
  switch (token.type) {
    case 'text':
      return token.text ?? '';
    case 'strong':
      return `<strong>${(token.tokens ?? []).map(renderToken).join('')}</strong>`;
    case 'paragraph':
      return `<p>${(token.tokens ?? []).map(renderToken).join('')}</p>\n`;
    case 'list':
      return '<ul><li>item</li></ul>\n';
    default:
      return token.text ?? '';
  }
}

export class Parser {
  static parse(tokens: Token[]): string {
    return tokens.map(renderToken).join('');
  }
}

export class MarkedRenderer {
  blockquote?: (input: { tokens: Token[] }) => string;
}

export const Tokens = {} as Record<string, unknown>;
