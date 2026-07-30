import { inject, Injectable } from '@angular/core';
import { MatDatepickerIntl } from '@angular/material/datepicker';
import { TranslateService } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Injectable()
export class CustomMatDatePickerIntlService extends MatDatepickerIntl {
  private readonly translate = inject(TranslateService);

  constructor() {
    super();

    this.translate.onLangChange.pipe(takeUntilDestroyed()).subscribe(() => {
      this.translateLabels();
    });

    this.translateLabels();
  }

  translateLabels() {
    this.calendarLabel = this.translate.instant('datepicker.calendar');
    this.openCalendarLabel = this.translate.instant('datepicker.openCalendar');
    this.closeCalendarLabel = this.translate.instant('datepicker.closeCalendar');
    this.prevMonthLabel = this.translate.instant('datepicker.prevMonth');
    this.nextMonthLabel = this.translate.instant('datepicker.nextMonth');
    this.prevYearLabel = this.translate.instant('datepicker.prevYear');
    this.nextYearLabel = this.translate.instant('datepicker.nextYear');
    this.prevMultiYearLabel = this.translate.instant('datepicker.prevMultiYear');
    this.nextMultiYearLabel = this.translate.instant('datepicker.nextMultiYear');
    this.switchToMonthViewLabel = this.translate.instant('datepicker.switchToMonthView');
    this.switchToMultiYearViewLabel = this.translate.instant('datepicker.switchToMultiYearView');

    this.changes.next();
  }
}
