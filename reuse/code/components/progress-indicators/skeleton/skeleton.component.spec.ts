import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCardModule } from '@angular/material/card';
import { NgxSkeletonLoaderComponent, NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { FormatEnum, SkeletonComponent } from './skeleton.component';
import { By } from '@angular/platform-browser';

describe('SkeletonComponent', () => {
  let component: SkeletonComponent;
  let fixture: ComponentFixture<SkeletonComponent>;

  const setSkeletonInput = (name: 'items' | 'format', value: number | FormatEnum) => {
    fixture.componentRef.setInput(name, value);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkeletonComponent, MatCardModule, NgxSkeletonLoaderModule],
    }).compileComponents();

    fixture = TestBed.createComponent(SkeletonComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('items', 3);
    fixture.componentRef.setInput('format', FormatEnum.LINE);
    fixture.detectChanges();
  });

  it('should create component with required inputs', () => {
    expect(component).toBeTruthy();
    expect(component.items()).toBe(3);
    expect(component.format()).toBe(FormatEnum.LINE);
  });

  it('should generate correct number of skeleton items in skeletons getter', () => {
    setSkeletonInput('items', 5);

    const skeletons = component.skeletons;
    expect(skeletons).toHaveLength(5);

    setSkeletonInput('items', 1);

    expect(component.skeletons).toHaveLength(1);
  });

  it('should render LINE format with correct ngx-skeleton-loader configuration', () => {
    setSkeletonInput('format', FormatEnum.LINE);
    setSkeletonInput('items', 2);

    // Check ngx-skeleton-loader is present
    const loaderDebug = fixture.debugElement.query(By.directive(NgxSkeletonLoaderComponent));
    expect(loaderDebug).toBeTruthy();

    const loaderInstance = loaderDebug.componentInstance as NgxSkeletonLoaderComponent;

    expect(loaderInstance.appearance()).toBe('line');
    expect(loaderInstance.count()).toBe(2);

    // Should not render card format
    const cardContainer = fixture.debugElement.query(By.css('.skeleton-grid-container'));
    expect(cardContainer).toBeFalsy();
  });

  it('should render CARD format with correct number of mat-cards', () => {
    setSkeletonInput('format', FormatEnum.CARD);
    setSkeletonInput('items', 3);

    const cardContainer = fixture.nativeElement.querySelector('.skeleton-grid-container');
    expect(cardContainer).toBeTruthy();

    const matCards = fixture.nativeElement.querySelectorAll('mat-card');
    expect(matCards).toHaveLength(3);

    // Each card should have mat-card-content with skeleton loaders
    const cardContents = fixture.nativeElement.querySelectorAll('mat-card-content');
    expect(cardContents).toHaveLength(3);

    // Should not render line format
    const lineLoader = fixture.nativeElement.querySelector('ngx-skeleton-loader[appearance="line"]');
    expect(lineLoader).toBeFalsy();
  });
});
