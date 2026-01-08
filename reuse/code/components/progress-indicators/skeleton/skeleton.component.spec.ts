import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCardModule } from '@angular/material/card';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { Component } from '@angular/core';
import { FormatEnum, SkeletonComponent } from './skeleton.component';

@Component({
  template: `<app-skeleton [items]="items" [format]="format"></app-skeleton>`,
  imports: [SkeletonComponent],
})
class TestHostComponent {
  items = 3;
  format = FormatEnum.LINE;
}

describe('SkeletonComponent', () => {
  let component: SkeletonComponent;
  let fixture: ComponentFixture<TestHostComponent>;
  let hostComponent: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkeletonComponent, TestHostComponent, MatCardModule, NgxSkeletonLoaderModule],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    component = fixture.debugElement.children[0].componentInstance;
    fixture.detectChanges();
  });

  it('should create component with required inputs', () => {
    expect(component).toBeTruthy();
    expect(component.items()).toBe(3);
    expect(component.format()).toBe(FormatEnum.LINE);
  });

  it('should generate correct number of skeleton items in skeletons getter', () => {
    hostComponent.items = 5;
    fixture.detectChanges();

    const skeletons = component.skeletons;
    expect(skeletons).toHaveLength(5);

    hostComponent.items = 1;
    fixture.detectChanges();

    expect(component.skeletons).toHaveLength(1);
  });

  it('should render LINE format with correct ngx-skeleton-loader configuration', () => {
    hostComponent.format = FormatEnum.LINE;
    hostComponent.items = 2;
    fixture.detectChanges();

    const lineLoader = fixture.nativeElement.querySelector('ngx-skeleton-loader[appearance="line"]');
    expect(lineLoader).toBeTruthy();
    expect(lineLoader.getAttribute('ng-reflect-count')).toBe('2');
    expect(lineLoader.classList.contains('skeleton-line')).toBe(true);

    // Should not render card format
    const cardContainer = fixture.nativeElement.querySelector('.skeleton-grid-container');
    expect(cardContainer).toBeFalsy();
  });

  it('should render CARD format with correct number of mat-cards', () => {
    hostComponent.format = FormatEnum.CARD;
    hostComponent.items = 3;
    fixture.detectChanges();

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
