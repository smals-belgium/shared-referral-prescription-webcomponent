import { ChangeDetectorRef, OnDestroy, Pipe, PipeTransform } from '@angular/core';
import { Subject } from 'rxjs';
import { DateAdapter } from '@angular/material/core';
import { DateTime } from 'luxon';
import { takeUntil } from 'rxjs/operators';

@Pipe({name: 'date', pure: false, standalone: true})
export class DatePipe implements PipeTransform, OnDestroy {
  private destroyed$ = new Subject<void>();
  private value?: string | Date | null;
  private dateFormat?: string;
  private formatted = '';

  constructor(
    private dateAdapter: DateAdapter<DateTime>,
    private cd: ChangeDetectorRef
  ) {
    this.listenForLangChanges();
  }

  transform(value?: string | Date | null, dateFormat = 'D'): string {
    if (!this.formatted || this.value !== value || this.dateFormat !== dateFormat) {
      this.value = value;
      this.dateFormat = dateFormat;
      this.formatDate();
    }
    return this.formatted;
  }

  private listenForLangChanges() {
    this.dateAdapter.localeChanges
      .pipe(
        takeUntil(this.destroyed$)
      )
      .subscribe(() => {
        this.formatDate();
        this.cd.markForCheck();
      });
  }

  private formatDate(): void {
    if (this.value && this.dateFormat && this.isDateValid(this.value)) {
      const dateTime = this.dateAdapter.parse(this.value, undefined);
      this.formatted = this.dateAdapter.format(dateTime!, this.dateFormat);
    } else {
      this.formatted = '';
    }
  }

  private isDateValid(date: string | Date): boolean {
    return typeof date === 'string'
      ? DateTime.fromISO(date).isValid
      : DateTime.fromJSDate(date).isValid;
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
