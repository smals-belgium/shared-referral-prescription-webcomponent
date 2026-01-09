import { IfStatusLoadingDirective } from './if-status-loading.directive';
import { createDirectiveMocks } from './test-utils';
import { LoadingStatus } from '@reuse/code/interfaces';

function triggerOnChanges(directive: any, value: any) {
  directive.ifStatusLoading = value;
  directive.ngOnChanges();
}

describe('IfStatusLoadingDirective', () => {

  it.each([
    { status: LoadingStatus.LOADING },
    { status: LoadingStatus.UPDATING },
  ])('should show when status is %s', ({ status }) => {
    const { templateRef, viewContainer, cdRef } = createDirectiveMocks();
    const directive = new IfStatusLoadingDirective(templateRef, viewContainer, cdRef);

    triggerOnChanges(directive, { status });

    expect(viewContainer.createEmbeddedView).toHaveBeenCalled();
    expect(viewContainer.clear).not.toHaveBeenCalled();
    expect(cdRef.markForCheck).toHaveBeenCalled();
  });

  it('should do nothing when SUCCESS and never shown before', () => {
    const { templateRef, viewContainer, cdRef } = createDirectiveMocks();
    const directive = new IfStatusLoadingDirective(templateRef, viewContainer, cdRef);

    triggerOnChanges(directive, { status: LoadingStatus.SUCCESS });

    expect(viewContainer.clear).not.toHaveBeenCalled();
    expect(viewContainer.createEmbeddedView).not.toHaveBeenCalled();
    expect(cdRef.markForCheck).not.toHaveBeenCalled();
  });

  it('should hide when SUCCESS after LOADING', () => {
    const { templateRef, viewContainer, cdRef } = createDirectiveMocks();
    const directive = new IfStatusLoadingDirective(templateRef, viewContainer, cdRef);

    triggerOnChanges(directive, { status: LoadingStatus.LOADING });
    expect(viewContainer.createEmbeddedView).toHaveBeenCalled();
    jest.clearAllMocks();

    triggerOnChanges(directive, { status: LoadingStatus.SUCCESS });

    expect(viewContainer.clear).toHaveBeenCalled();
    expect(viewContainer.createEmbeddedView).not.toHaveBeenCalled();
    expect(cdRef.markForCheck).toHaveBeenCalled();
  });
});
