import { HttpClient } from '@angular/common/http';
import { MARKED_OPTIONS, MarkedOptions, MarkedRenderer, provideMarkdown as provide } from 'ngx-markdown';
import { Parser } from 'marked';
import { DomSanitizer } from '@angular/platform-browser';

export function provideMarkdown() {
  return provide({
    loader: HttpClient,
    markedOptions: {
      provide: MARKED_OPTIONS,
      useFactory: markedOptionsFactory,
      deps: [DomSanitizer],
    },
  });
}

export function markedOptionsFactory(): MarkedOptions {
  const renderer = new MarkedRenderer();

  renderer.blockquote = ({ tokens }) => {
    return `<div class="infoblock evf-infoblock" aria-label="Info">
            <span>${Parser.parse(tokens)}</span>
          </div>`;
  };
  return {
    renderer,
  };
}
