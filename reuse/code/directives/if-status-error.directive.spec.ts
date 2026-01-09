import { IfStatusErrorDirective } from './if-status-error.directive';
import { createDirectiveMocks } from './test-utils';
import { LoadingStatus } from '@reuse/code/interfaces';

describe('IfStatusErrorDirective', () => {
  it('should show only when status is ERROR', () => {
    const { templateRef, viewContainer, cdRef } = createDirectiveMocks();
    const directive = new IfStatusErrorDirective(templateRef, viewContainer, cdRef);

    // ERROR → shows
    directive.ifStatusError = { status: LoadingStatus.ERROR } as any;
    directive.ngOnChanges();

    expect(viewContainer.createEmbeddedView).toHaveBeenCalled();
    expect(viewContainer.clear).not.toHaveBeenCalled();
    expect(cdRef.markForCheck).toHaveBeenCalled();

    jest.clearAllMocks();

    // NON-ERROR → clears
    directive.ifStatusError = { status: LoadingStatus.SUCCESS } as any;
    directive.ngOnChanges();

    expect(viewContainer.clear).toHaveBeenCalled();
    expect(viewContainer.createEmbeddedView).not.toHaveBeenCalled();
    expect(cdRef.markForCheck).toHaveBeenCalled();
  });
});
