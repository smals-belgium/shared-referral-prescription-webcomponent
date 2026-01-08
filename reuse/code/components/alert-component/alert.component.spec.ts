import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange, SimpleChanges } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { AlertComponent as MhAlertComponent } from '@myhealth-belgium/myhealth-additional-ui-components';

import { AlertComponent } from './alert.component';
import { By } from '@angular/platform-browser';
import { AlertType } from '@reuse/code/interfaces';

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
    expect(component.alert).toBe(AlertType.Error);
    expect(component.title).toBe('');
    expect(component.showRetry).toBe(true);
    expect(component.genericErrorMsgKey).toBeUndefined();
  });

  it('should have correct generic errors mapping', () => {
    expect(component.genericErrors).toEqual({
      403: 'common.forbiddenResource',
      404: 'common.notFoundResource',
    });
  });

  it('should call setGenericErrorMsgKey when error input changes', () => {
    const spy = jest.spyOn(component as any, 'setGenericErrorMsgKey');

    const changes: SimpleChanges = {
      error: new SimpleChange(null, new HttpErrorResponse({ status: 404 }), false),
    };

    component.ngOnChanges(changes);
    expect(spy).toHaveBeenCalled();
  });

  it('should not call setGenericErrorMsgKey when other properties change', () => {
    const spy = jest.spyOn(component as any, 'setGenericErrorMsgKey');

    const changes: SimpleChanges = {
      title: new SimpleChange('', 'New Title', false),
    };

    component.ngOnChanges(changes);
    expect(spy).not.toHaveBeenCalled();
  });

  it('should set genericErrorMsgKey for 403 error', () => {
    component.error = new HttpErrorResponse({ status: 403 });
    (component as any).setGenericErrorMsgKey();

    expect(component.genericErrorMsgKey).toBe('common.forbiddenResource');
  });

  it('should set genericErrorMsgKey for 404 error', () => {
    component.error = new HttpErrorResponse({ status: 404 });
    (component as any).setGenericErrorMsgKey();

    expect(component.genericErrorMsgKey).toBe('common.notFoundResource');
  });

  it('should set genericErrorMsgKey to undefined for unmapped error codes', () => {
    component.error = new HttpErrorResponse({ status: 500 });
    (component as any).setGenericErrorMsgKey();

    expect(component.genericErrorMsgKey).toBeUndefined();
  });

  it('should set genericErrorMsgKey to undefined when error is null', () => {
    component.error = undefined;
    (component as any).setGenericErrorMsgKey();

    expect(component.genericErrorMsgKey).toBeUndefined();
  });

  it('should emit clickRetry event', () => {
    const spy = jest.spyOn(component.clickRetry, 'emit');

    component.clickRetry.emit();
    expect(spy).toHaveBeenCalled();
  });

  it('should pass correct inputs to mh-alert component', () => {
    component.alert = AlertType.Warning;
    component.title = 'Test Title';
    component.showRetry = false;

    fixture.detectChanges();

    const mhAlert = fixture.debugElement.query(By.css('mh-alert'));
    expect(mhAlert).toBeTruthy();
    expect(mhAlert.componentInstance.usage()).toBe('warning');
    expect(mhAlert.componentInstance.backgroundColor()).toBe('color');
    expect(mhAlert.componentInstance.actionButton()).toBe(false);
  });
});
