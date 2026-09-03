import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';

import { DialogLayoutComponent } from './dialog-layout.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatIconTestingModule } from '@angular/material/icon/testing';

@Component({
  template: `
    <app-dialog-layout title="Projected Title">
      <p dialog-content class="main-content">Main content</p>
    </app-dialog-layout>
  `,
  imports: [DialogLayoutComponent],
})
class TestHostComponent {}

@Component({
  template: `
    <app-dialog-layout title="Projected Title">
      <p dialog-content class="main-content">Main content</p>
      <div #overrideActions dialog-actions-override>
        <button>test1</button>
      </div>
    </app-dialog-layout>
  `,
  imports: [DialogLayoutComponent],
})
class TestHostFullComponent {}

const mockDialogRef = { close: jest.fn() };

describe('DialogLayoutComponent', () => {
  let fixture: ComponentFixture<DialogLayoutComponent>;
  let component: DialogLayoutComponent;

  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogLayoutComponent, NoopAnimationsModule, TranslateModule.forRoot(), MatIconTestingModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: {} },
        TranslateService,
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

    it('should close the dialog without data when not defined', () => {
      const mockCancelData = undefined;

      fixture.componentRef.setInput('cancelData', mockCancelData);

      fixture.detectChanges();
      const cancelButton = fixture.debugElement.query(By.css('[data-cy="dialog-cancel-button"]'));

      cancelButton.nativeElement.click();

      expect(mockDialogRef.close).toHaveBeenCalledWith(mockCancelData);
    });

    it('should close the dialog with cancelData data when defined', () => {
      const mockCancelData = { reload: true };

      fixture.componentRef.setInput('cancelData', mockCancelData);

      fixture.detectChanges();
      const cancelButton = fixture.debugElement.query(By.css('[data-cy="dialog-cancel-button"]'));

      cancelButton.nativeElement.click();

      expect(mockDialogRef.close).toHaveBeenCalledWith(mockCancelData);
    });
  });
});

describe('DialogLayoutComponent - content projection', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent, NoopAnimationsModule, TranslateModule.forRoot(), MatIconTestingModule],
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

  it('should project display default buttons if nothing overrides it', () => {
    const elements = fixture.debugElement.queryAll(By.css('mat-dialog-actions button'));
    expect(elements).toBeTruthy();
    expect(elements).toHaveLength(2);
    expect(elements[0]?.nativeElement?.textContent).toContain('common.confirm');
    expect(elements[1]?.nativeElement?.textContent).toContain('common.cancel');
  });

  describe('Custom implementation of actions', () => {
    let overrideFixture: ComponentFixture<TestHostFullComponent>;
    beforeEach(async () => {
      TestBed.resetTestingModule();

      await TestBed.configureTestingModule({
        imports: [TestHostFullComponent, NoopAnimationsModule, TranslateModule.forRoot(), MatIconTestingModule],
        providers: [
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: {} },
        ],
      }).compileComponents();

      overrideFixture = TestBed.createComponent(TestHostFullComponent);
      overrideFixture.detectChanges();
    });
    it('should project display override content if something is defined', () => {
      const elements = overrideFixture.debugElement.query(By.css('mat-dialog-actions button'));
      expect(elements).toBeTruthy();
      expect(elements.nativeElement.textContent.trim()).toBe('test1');
    });
  });
});
