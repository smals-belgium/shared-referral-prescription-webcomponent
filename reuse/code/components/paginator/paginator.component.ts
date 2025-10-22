import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-paginator',
  templateUrl: './paginator.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatPaginator, TranslateModule],
})
export class PaginatorComponent {
  readonly pageSizeOptions = [10, 15, 20, 25];

  @Input() total = 0;
  @Input() page = 1;
  @Input() pageSize = 10;

  @Output() changePage = new EventEmitter<{ pageIndex?: number; pageSize?: number }>();

  get pageIndex() {
    return this.page - 1;
  }

  handlePageEvent(e: PageEvent) {
    if (e.pageIndex !== this.pageIndex || e.pageSize !== this.pageSize) {
      this.changePage.emit({ pageIndex: e.pageIndex + 1, pageSize: e.pageSize });
    }
  }
}
