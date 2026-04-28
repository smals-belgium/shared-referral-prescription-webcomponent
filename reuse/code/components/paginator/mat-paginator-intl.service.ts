import { inject, Injectable } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { TranslateService } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Injectable()
export class MatPaginatorIntlService extends MatPaginatorIntl {
  private readonly translate = inject(TranslateService);

  constructor() {
    super();

    this.translate.onLangChange.pipe(takeUntilDestroyed()).subscribe(() => {
      this.translateLabels();
    });

    this.translateLabels();
  }

  translateLabels(): void {
    this.itemsPerPageLabel = this.translate.instant('pagination.itemsPerPage');
    this.firstPageLabel = this.translate.instant('pagination.firstPage');
    this.lastPageLabel = this.translate.instant('pagination.lastPage');
    this.nextPageLabel = this.translate.instant('pagination.nextPage');
    this.previousPageLabel = this.translate.instant('pagination.previousPage');

    this.changes.next();
  }

  override getRangeLabel = (page: number, pageSize: number, length: number): string => {
    if (length === 0 || pageSize === 0) {
      return this.translate.instant('pagination.rangePage', {
        startIndex: 0,
        endIndex: 0,
        length,
      });
    }

    const startIndex = page * pageSize;
    const endIndex = startIndex < length ? Math.min(startIndex + pageSize, length) : startIndex + pageSize;

    return this.translate.instant('pagination.rangePage', {
      startIndex: startIndex + 1,
      endIndex,
      length,
    });
  };
}
