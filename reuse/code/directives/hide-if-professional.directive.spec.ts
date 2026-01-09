import { HideIfProfessionalDirective } from './hide-if-professional.directive';
import { of } from 'rxjs';
import { createDirectiveMocks } from './test-utils';

describe('HideIfProfessionalDirective', () => {
  it('should hide if the user is professional, show otherwise', () => {
    const { templateRef, viewContainer, authService, cdRef } = createDirectiveMocks();

    authService.isProfessional.mockReturnValue(of(true));
    let directive = new HideIfProfessionalDirective(
      templateRef, viewContainer, authService, cdRef
    );
    directive.ngOnInit();

    expect(viewContainer.clear).toHaveBeenCalled();
    expect(viewContainer.createEmbeddedView).not.toHaveBeenCalled();
    expect(cdRef.markForCheck).toHaveBeenCalled();

    jest.clearAllMocks();

    authService.isProfessional.mockReturnValue(of(false));
    directive = new HideIfProfessionalDirective(
      templateRef, viewContainer, authService, cdRef
    );
    directive.ngOnInit();

    expect(viewContainer.createEmbeddedView).toHaveBeenCalled();
    expect(viewContainer.clear).not.toHaveBeenCalled();
    expect(cdRef.markForCheck).toHaveBeenCalled();
  });
});
