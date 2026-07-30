import { ComponentFixture, TestBed } from '@angular/core/testing';
import { computed, signal, SimpleChange, SimpleChanges } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { AlertComponent as MhAlertComponent } from '@myhealth-belgium/myhealth-additional-ui-components';

import { AlertComponent } from './alert.component';
import { By } from '@angular/platform-browser';
import { AlertType } from '@reuse/code/interfaces';
import { ResolvedError } from '@reuse/code/interfaces/error.interface';

describe('AlertComponent', () => {
  let component: AlertComponent;
  let fixture: ComponentFixture<AlertComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlertComponent, MhAlertComponent, TranslateModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(AlertComponent);
    component = fixture.componentInstance;
  });

  it('should create component with default values', () => {
    expect(component).toBeTruthy();
    expect(component.severity()).toBe(AlertType.Error);
    expect(component.title()).toBe('');
    expect(component.subTitle()).toBe('');
    expect(component.errorId()).toBeUndefined();
    expect(component.dismissible()).toBeTruthy();
    expect(component.retry()).toBeTruthy();
    expect(component.message()).toBeUndefined();
  });

  it('should get correct dismissMode from dismissable', () => {
    fixture.componentRef.setInput('dismissible', true);
    expect((component as any).dismissMode()).toBe('closable');

    fixture.componentRef.setInput('dismissible', false);
    expect((component as any).dismissMode()).toBe('pinned');
  });

  it('should emit clickRetry event', () => {
    const spy = jest.spyOn(component.clickRetry, 'emit');

    component.clickRetry.emit();
    expect(spy).toHaveBeenCalled();
  });

  it('should pass correct inputs to mh-alert component', () => {
    fixture.componentRef.setInput('severity', AlertType.Warning);
    fixture.componentRef.setInput('title', 'Test Title');
    fixture.componentRef.setInput('retry', false);

    fixture.detectChanges();

    const mhAlert = fixture.debugElement.query(By.css('mh-alert'));
    expect(mhAlert).toBeTruthy();
    expect(mhAlert.componentInstance.usage()).toBe('warning');
    expect(mhAlert.componentInstance.backgroundColor()).toBe('color');
    expect(mhAlert.componentInstance.actionButton()).toBe(false);
  });

  it('should check if message needs to be translated', () => {
    expect((component as any).resolvedMessage()).toBeNull();

    fixture.componentRef.setInput('message', 'key.string');
    expect((component as any).resolvedMessage()).toEqual({ value: 'key.string', isTranslated: false });

    fixture.componentRef.setInput('message', { value: 'message', isTranslated: true });
    expect((component as any).resolvedMessage()).toEqual({ value: 'message', isTranslated: true });
  });
});
