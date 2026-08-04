import { TestBed } from '@angular/core/testing';
import { AlertService } from './alert.service';
import { ResolvedError } from '@reuse/code/interfaces/error.interface';
import { AlertType } from '@reuse/code/interfaces';

describe('AlertService', () => {
  let service: AlertService;

  const defaultError: ResolvedError = {
    title: 'errors.common.title',
    message: 'errors.api.unknown',
    severity: AlertType.Error,
    dismissible: true,
    retry: false,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [AlertService] });
    service = TestBed.inject(AlertService);
  });

  it('returns null from a target that has never received an alert', () => {
    expect(service.setTarget('empty-target')()).toBeNull();
  });

  it('exposes a shown alert through the target signal', () => {
    const target = service.setTarget('cancel-dialog');
    service.show('cancel-dialog', defaultError);
    expect(target()).toEqual(defaultError);
  });

  it('returns the same signal instance for the same target name', () => {
    const first = service.setTarget('shared');
    const second = service.setTarget('shared');
    expect(first).toBe(second);
  });

  it('isolates alerts between different targets', () => {
    const dialog = service.setTarget('dialog');
    const page = service.setTarget('page');
    service.show('dialog', defaultError);
    expect(dialog()).toEqual(defaultError);
    expect(page()).toBeNull();
  });

  it('clears the alert in a target', () => {
    const target = service.setTarget('clearable');
    service.show('clearable', defaultError);
    service.clear('clearable');
    expect(target()).toBeNull();
  });

  it('routes showCurrentActiveAlert to the active target', () => {
    const dialogTarget = service.setTarget('dialog');
    service.setActive('dialog');
    service.showCurrentActiveAlert(defaultError);
    expect(dialogTarget()).toEqual(defaultError);
  });

  it('falls back to the global target after resetActive', () => {
    const global = service.setTarget('global');
    const dialog = service.setTarget('dialog');
    service.setActive('dialog');
    service.resetActive();
    service.showCurrentActiveAlert(defaultError);
    expect(global()).toEqual(defaultError);
    expect(dialog()).toBeNull();
  });

  it('builds a general error with defaults', () => {
    const error = service.getGeneralError('some.message.key');
    expect(error).toEqual({
      title: 'common.error.default.header',
      subTitle: 'common.error.default.subheader',
      message: 'some.message.key',
      severity: AlertType.Error,
      dismissible: true,
      retry: false,
    });
  });

  it('respects overrides on getGeneralError', () => {
    const error = service.getGeneralError('some.key', {
      dismissible: false,
      severity: AlertType.Warning,
      retry: true,
    });
    expect(error.dismissible).toBe(false);
    expect(error.severity).toBe(AlertType.Warning);
    expect(error.retry).toBe(true);
  });

  it('replaces a previously shown alert in the same target', () => {
    const target = service.setTarget('replaceable');
    const second: ResolvedError = { ...defaultError, message: 'second' };
    service.show('replaceable', defaultError);
    service.show('replaceable', second);
    expect(target()).toEqual(second);
  });
});
