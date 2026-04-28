import { HttpClient } from '@angular/common/http';
import { MARKED_OPTIONS, MarkedOptions, MarkedRenderer, provideMarkdown as provide } from 'ngx-markdown';
import { Parser, Tokens } from 'marked';
import { DomSanitizer } from '@angular/platform-browser';
import { InjectionToken } from '@angular/core';

export const MARKDOWN_OPTIONS_CONFIG = new InjectionToken<{ open: boolean }>('MARKDOWN_OPTIONS_CONFIG');

export function provideMarkdown() {
  return provide({
    loader: HttpClient,
    markedOptions: {
      provide: MARKED_OPTIONS,
      useFactory: markedOptionsFactory,
      deps: [MARKDOWN_OPTIONS_CONFIG, DomSanitizer],
    },
  });
}

export function markedOptionsFactory(config: { open: boolean }): MarkedOptions {
  const renderer = new MarkedRenderer();

  renderer.blockquote = ({ tokens }) => {
    const first = tokens[0]?.type === 'paragraph' ? (tokens[0] as Tokens.Paragraph) : null;
    const rest = first ? tokens.slice(1) : tokens;

    const title = first
      ? Parser.parse([first])
          .replace(/^<p>/, '')
          .replace(/<\/p>\n?$/, '')
      : undefined;

    if (title && rest.length > 0) {
      return `<div class="infoblock evf-infoblock-summary" aria-label="Info">
                <details ${config.open ? 'open' : ''}>
                 <summary class="title">${title}</summary>
                 <div class="body">${Parser.parse(rest)}</div>
                </details>
              </div>`;
    }

    return `<div class="infoblock evf-infoblock" aria-label="Info">
              <span>${Parser.parse(tokens)}</span>
            </div>`;
  };
  return {
    renderer,
  };
}
