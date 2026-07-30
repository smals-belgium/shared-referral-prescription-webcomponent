import { TestBed } from '@angular/core/testing';

import { CustomMatDatePickerIntlService } from './custom-mat-date-picker-intl.service';
import { MatPaginatorIntlService } from '@reuse/code/components/paginator/mat-paginator-intl.service';
import { Subject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Lang } from '@reuse/code/constants/languages';

describe('CustomMatDatePickerIntlService', () => {
  let service: CustomMatDatePickerIntlService;
  let translateMock: {
    instant: jest.Mock;
    onLangChange: Subject<any>;
  };

  beforeEach(() => {
    translateMock = {
      instant: jest.fn(),
      onLangChange: new Subject(),
    };

    TestBed.configureTestingModule({
      providers: [CustomMatDatePickerIntlService, { provide: TranslateService, useValue: translateMock }],
    });
    service = TestBed.inject(CustomMatDatePickerIntlService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should translate labels on initialization', () => {
    translateMock.instant.mockImplementation((key: string) => key);

    service.translateLabels();

    expect(service.calendarLabel).toBe('datepicker.calendar');
    expect(service.openCalendarLabel).toBe('datepicker.openCalendar');
    expect(service.closeCalendarLabel).toBe('datepicker.closeCalendar');
    expect(service.prevMonthLabel).toBe('datepicker.prevMonth');
    expect(service.nextMonthLabel).toBe('datepicker.nextMonth');
    expect(service.prevYearLabel).toBe('datepicker.prevYear');
    expect(service.nextYearLabel).toBe('datepicker.nextYear');
    expect(service.prevMultiYearLabel).toBe('datepicker.prevMultiYear');
    expect(service.nextMultiYearLabel).toBe('datepicker.nextMultiYear');
    expect(service.switchToMonthViewLabel).toBe('datepicker.switchToMonthView');
    expect(service.switchToMultiYearViewLabel).toBe('datepicker.switchToMultiYearView');
  });

  it('should emit changes when labels are translated', () => {
    const spy = jest.spyOn(service.changes, 'next');
    translateMock.instant.mockReturnValue('translated');

    service.translateLabels();

    expect(spy).toHaveBeenCalled();
  });

  it('should re-translate labels when language changes', () => {
    const spy = jest.spyOn(service, 'translateLabels');

    translateMock.onLangChange.next({ lang: Lang.FR.short });

    expect(spy).toHaveBeenCalled();
  });
});
