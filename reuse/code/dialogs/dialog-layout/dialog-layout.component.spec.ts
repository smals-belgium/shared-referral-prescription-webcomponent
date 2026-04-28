import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';

import { DialogLayoutComponent } from './dialog-layout.component';

@Component({
  template: `
    <app-dialog-layout title="Projected Title">
      <p dialog-content class="main-content">Main content</p>
      <button dialog-actions class="action-button">Action</button>
    </app-dialog-layout>
  `,
  imports: [DialogLayoutComponent],
})
class TestHostComponent {}

const mockDialogRef = { close: jest.fn() };

describe('DialogLayoutComponent', () => {
  let fixture: ComponentFixture<DialogLayoutComponent>;
  let component: DialogLayoutComponent;

  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogLayoutComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DialogLayoutComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('title', 'Test Title');
    fixture.detectChanges();
  });

  describe('close button', () => {
    it('should close the dialog when clicked', () => {
      const closeButton = fixture.debugElement.query(By.css('[mat-dialog-close]'));
      closeButton.nativeElement.click();
      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });
});

describe('DialogLayoutComponent - content projection', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('should render the title from input', () => {
    const titleEl = fixture.debugElement.query(By.css('.dialog-title'));
    expect(titleEl.nativeElement.textContent).toContain('Projected Title');
  });

  it('should project default content into the content area', () => {
    const content = fixture.debugElement.query(By.css('.main-content'));
    expect(content.nativeElement.textContent).toContain('Main content');
  });

  it('should project dialog-actions content into the actions area', () => {
    const actionButton = fixture.debugElement.query(By.css('mat-dialog-actions .action-button'));
    expect(actionButton).toBeTruthy();
    expect(actionButton.nativeElement.textContent).toContain('Action');
  });
});
