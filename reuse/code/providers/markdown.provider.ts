import { HttpClient } from '@angular/common/http';
import { MARKED_OPTIONS, MarkedOptions, MarkedRenderer, provideMarkdown as provide } from 'ngx-markdown';
import { Parser } from 'marked';

export function provideMarkdown() {
  return provide({
    loader: HttpClient,
    markedOptions: {
      provide: MARKED_OPTIONS,
      useFactory: markedOptionsFactory,
    },
  })
}

export function markedOptionsFactory(): MarkedOptions {
  const renderer = new MarkedRenderer();

  renderer.blockquote = ({tokens}) => {
    return (
      '<div class="infoblock"><i class="material-icons">info_outline</i><span>' +
      Parser.parse(tokens) +
      '</span></div>'
    );
  };
  return {
    renderer,
  };
}
