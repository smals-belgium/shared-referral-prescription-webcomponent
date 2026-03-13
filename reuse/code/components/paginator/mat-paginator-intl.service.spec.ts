import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { MatPaginatorIntlService } from './mat-paginator-intl.service';
import { Lang } from '@reuse/code/constants/languages';

describe('MatPaginatorIntlService', () => {
  let service: MatPaginatorIntlService;
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
      providers: [MatPaginatorIntlService, { provide: TranslateService, useValue: translateMock }],
    });

    service = TestBed.inject(MatPaginatorIntlService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should translate labels on initialization', () => {
    translateMock.instant.mockImplementation((key: string) => key);

    service.translateLabels();

    expect(service.itemsPerPageLabel).toBe('pagination.itemsPerPage');
    expect(service.firstPageLabel).toBe('pagination.firstPage');
    expect(service.lastPageLabel).toBe('pagination.lastPage');
    expect(service.nextPageLabel).toBe('pagination.nextPage');
    expect(service.previousPageLabel).toBe('pagination.previousPage');
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

  it('should return correct range label for normal case', () => {
    translateMock.instant.mockImplementation((_key, params) => {
      return `${params.startIndex} - ${params.endIndex} of ${params.length}`;
    });

    const result = service.getRangeLabel(0, 10, 100);

    expect(result).toBe('1 - 10 of 100');
    expect(translateMock.instant).toHaveBeenCalledWith('pagination.rangePage', {
      startIndex: 1,
      endIndex: 10,
      length: 100,
    });
  });

  it('should return correct range label when length is 0', () => {
    translateMock.instant.mockImplementation((_key, params) => {
      return `${params.startIndex} - ${params.endIndex} of ${params.length}`;
    });

    const result = service.getRangeLabel(0, 10, 0);

    expect(result).toBe('0 - 0 of 0');
    expect(translateMock.instant).toHaveBeenCalledWith('pagination.rangePage', {
      startIndex: 0,
      endIndex: 0,
      length: 0,
    });
  });
});
