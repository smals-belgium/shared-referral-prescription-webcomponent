import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { NgFor, NgIf } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import {TranslateModule} from "@ngx-translate/core";

@Component({
  standalone: true,
  selector: 'app-paginator',
  templateUrl: './paginator.component.html',
  styleUrls: ['./paginator.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatIconModule,
    NgIf,
    NgFor,
    TranslateModule
  ]
})
export class PaginatorComponent implements OnChanges {

  totalPages = 0;
  displayedPages: (number | string)[] = [];

  @Input() total = 0;
  @Input() page = 0;
  @Input() pageSize = 10;

  @Output() changePage = new EventEmitter<number>();

  ngOnChanges(changes: SimpleChanges): void {
    this.totalPages = this.total > 0 ? Math.ceil(this.total / this.pageSize) : 1;
    if (this.totalPages < 6) {
      this.displayedPages = Array.from({length: this.totalPages}, (_, i) => i + 1);
    } else if (this.page < 3) {
      this.displayedPages = [1, 2, 3, 4, '...', this.totalPages];
    } else if (this.page === 3) {
      this.displayedPages = [1, 2, 3, 4, '...', this.totalPages];
    } else if (this.page > this.totalPages - 2) {
      this.displayedPages = [1, '...', this.totalPages - 3, this.totalPages - 2, this.totalPages - 1, this.totalPages];
    } else if (this.page === this.totalPages - 2) {
      this.displayedPages = [1, '...', this.totalPages - 3, this.totalPages - 2, this.totalPages - 1, this.totalPages];
    } else {
      this.displayedPages = [1, '...', this.page - 1, this.page, this.page + 1, '...', this.totalPages];
    }
  }

}
