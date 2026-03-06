import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivePageComponent } from './active-page.component';
import { By } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';

describe('ActivePageComponent', () => {
  let component: ActivePageComponent;
  let fixture: ComponentFixture<ActivePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivePageComponent, CommonModule], // standalone component
    }).compileComponents();

    fixture = TestBed.createComponent(ActivePageComponent);
    component = fixture.componentInstance;
  });

  it('should calculate rangeStart and rangeEnd for normal page', () => {
    component.total = 50;
    component.page = 2;
    component.pageSize = 10;

    component.ngOnChanges();

    expect(component.rangeStart).toBe(11); // (2-1)*10 +1
    expect(component.rangeEnd).toBe(20);   // min(11+10-1, 50)
  });

  it('should handle last page with less than pageSize items', () => {
    component.total = 25;
    component.page = 3;
    component.pageSize = 10;

    component.ngOnChanges();

    expect(component.rangeStart).toBe(21);
    expect(component.rangeEnd).toBe(25); // total < rangeEnd
  });

  it('should handle page = 0', () => {
    component.total = 50;
    component.page = 0;
    component.pageSize = 10;

    component.ngOnChanges();

    expect(component.rangeStart).toBe(-9); // (0-1)*10 +1 = -9
    expect(component.rangeEnd).toBe(0);    // min(-9+10, 50) = 0
  });

  it('should render correct template text', () => {
    component.total = 35;
    component.page = 2;
    component.pageSize = 10;
    component.label = 'items';

    component.ngOnChanges();
    fixture.detectChanges();

    const text = fixture.debugElement.nativeElement.textContent.trim();
    expect(text).toContain('11 - 20 / 35 items');
  });

  it('should render when total less than pageSize', () => {
    component.total = 5;
    component.page = 1;
    component.pageSize = 10;
    component.label = 'records';

    component.ngOnChanges();
    fixture.detectChanges();

    const text = fixture.debugElement.nativeElement.textContent.trim();
    expect(text).toContain('1 - 5 / 5 records');
  });
});
