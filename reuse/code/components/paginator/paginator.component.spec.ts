import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { PaginatorComponent } from './paginator.component';

describe('PaginatorComponent', () => {
  let component: PaginatorComponent;
  let fixture: ComponentFixture<PaginatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaginatorComponent, MatPaginatorModule, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(PaginatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.total).toBe(0);
    expect(component.page).toBe(1);
    expect(component.pageSize).toBe(10);
    expect(component.pageSizeOptions).toEqual([10, 15, 20, 25]);
  });

  it('should accept input values', () => {
    component.total = 100;
    component.page = 3;
    component.pageSize = 20;

    expect(component.total).toBe(100);
    expect(component.page).toBe(3);
    expect(component.pageSize).toBe(20);
  });

  it('should return correct pageIndex when page is 1', () => {
    component.page = 1;
    expect(component.pageIndex).toBe(0);
  });

  describe('handlePageEvent', () => {
    let changePageSpy: jest.SpyInstance;

    beforeEach(() => {
      changePageSpy = jest.spyOn(component.changePage, 'emit');
    });

    it('should emit new page number when pageIndex changes', () => {
      component.page = 1; // pageIndex = 0
      component.pageSize = 10;

      const pageEvent: PageEvent = {
        pageIndex: 2, // Moving to page 3
        pageSize: 10,
        length: 100,
      };

      component.handlePageEvent(pageEvent);

      expect(changePageSpy).toHaveBeenCalledWith({ pageIndex: 3, pageSize: 10 }); // pageIndex + 1
    });

    it('should emit new page size when pageSize changes', () => {
      component.page = 1; // pageIndex = 0
      component.pageSize = 10;

      const pageEvent: PageEvent = {
        pageIndex: 0, // Same pageIndex
        pageSize: 20, // Different pageSize
        length: 100,
      };

      component.handlePageEvent(pageEvent);

      expect(changePageSpy).toHaveBeenCalledWith({ pageIndex: 1, pageSize: 20 });
    });

    it('should not emit when neither pageIndex nor pageSize changes', () => {
      component.page = 3; // pageIndex = 2
      component.pageSize = 15;

      const pageEvent: PageEvent = {
        pageIndex: 2, // Same pageIndex
        pageSize: 15, // Same pageSize
        length: 100,
      };

      component.handlePageEvent(pageEvent);

      expect(changePageSpy).not.toHaveBeenCalled();
    });

    it('should prioritize pageIndex change over pageSize change when both differ', () => {
      component.page = 1; // pageIndex = 0
      component.pageSize = 10;

      const pageEvent: PageEvent = {
        pageIndex: 3, // Different pageIndex
        pageSize: 25, // Different pageSize
        length: 100,
      };

      component.handlePageEvent(pageEvent);

      // Should emit page number (pageIndex + 1), not pageSize
      expect(changePageSpy).toHaveBeenCalledWith({ pageIndex: 4, pageSize: 25 });
      expect(changePageSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle edge case with pageIndex 0', () => {
      component.page = 5; // pageIndex = 4
      component.pageSize = 10;

      // Move to first page
      const pageEvent: PageEvent = {
        pageIndex: 0,
        pageSize: 10,
        length: 100,
      };

      component.handlePageEvent(pageEvent);

      expect(changePageSpy).toHaveBeenCalledWith({ pageIndex: 1, pageSize: 10 });
    });
  });
});
