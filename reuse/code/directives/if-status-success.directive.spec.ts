import { IfStatusLoadingDirective } from './if-status-loading.directive';
import { createDirectiveMocks } from './test-utils';

function triggerOnChanges(directive: any, prop: string, value: any) {
  directive[prop] = value;
  directive.ngOnChanges({
    [prop]: {
      currentValue: value,
      previousValue: undefined,
      firstChange: true,
      isFirstChange: () => true,
    },
  });
}

describe('IfStatusLoadingDirective', () => {
  it('shows when status = LOADING', () => {
    const { templateRef, viewContainer, cdRef } = createDirectiveMocks();
    const directive = new IfStatusLoadingDirective(templateRef, viewContainer, cdRef);

    triggerOnChanges(directive, 'ifStatusLoading', { status: 'LOADING' });

    expect(viewContainer.createEmbeddedView).toHaveBeenCalled();
    expect(viewContainer.clear).not.toHaveBeenCalled();
    expect(cdRef.markForCheck).toHaveBeenCalled();
  });

  it('shows when status = UPDATING', () => {
    const { templateRef, viewContainer, cdRef } = createDirectiveMocks();
    const directive = new IfStatusLoadingDirective(templateRef, viewContainer, cdRef);

    triggerOnChanges(directive, 'ifStatusLoading', { status: 'UPDATING' });

    expect(viewContainer.createEmbeddedView).toHaveBeenCalled();
    expect(viewContainer.clear).not.toHaveBeenCalled();
    expect(cdRef.markForCheck).toHaveBeenCalled();
  });
});
