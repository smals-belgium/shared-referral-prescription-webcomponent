import { Component, Injectable, NgModule, Pipe, PipeTransform } from '@angular/core';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'markdown',
  template: '<ng-content></ng-content>',
  standalone: true,
})
export class MarkdownComponent {}

@Pipe({
  name: 'markdown',
  standalone: true,
})
export class MarkdownPipe implements PipeTransform {
  transform(value: unknown): unknown {
    return value;
  }
}

@Injectable()
export class MarkdownService {
  parse(value: string): Observable<string> {
    return of(value);
  }
}

@NgModule({
  imports: [MarkdownComponent, MarkdownPipe],
  exports: [MarkdownComponent, MarkdownPipe],
})
export class MarkdownModule {
  static forRoot() {
    return {
      ngModule: MarkdownModule,
      providers: [MarkdownService],
    };
  }
}

export const MARKED_OPTIONS = 'MARKED_OPTIONS';
export type MarkedOptions = Record<string, unknown>;
export class MarkedRenderer {
  [key: string]: unknown;
}

export function provideMarkdown() {
  return [];
}
