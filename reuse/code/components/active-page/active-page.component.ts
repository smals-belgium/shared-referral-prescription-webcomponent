import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-active-page',
  templateUrl: './active-page.component.html',
  styleUrls: ['./active-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActivePageComponent implements OnChanges {

  rangeStart = 0;
  rangeEnd = 0;

  @Input() total = 0;
  @Input() page = 0;
  @Input() pageSize = 10;
  @Input() label!: string;

  ngOnChanges(changes: SimpleChanges): void {
    this.rangeStart = ((this.page - 1) * this.pageSize) + 1;
    this.rangeEnd = Math.min(
      ((this.page - 1) * this.pageSize) + this.pageSize,
      this.total
    );
  }

}
