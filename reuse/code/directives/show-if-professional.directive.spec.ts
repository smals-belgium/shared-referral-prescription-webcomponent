import { ShowIfProfessionalDirective } from './show-if-professional.directive';
import { of } from 'rxjs';
import { createDirectiveMocks } from './test-utils';

describe('ShowIfProfessionalDirective (essential test)', () => {
  it('should show if the user is professional, hide otherwise', () => {
    const { templateRef, viewContainer, authService, cdRef } = createDirectiveMocks();

    authService.isProfessional.mockReturnValue(of(true));
    let directive = new ShowIfProfessionalDirective(
      templateRef, viewContainer, authService, cdRef
    );
    directive.ngOnInit();

    expect(viewContainer.createEmbeddedView).toHaveBeenCalled();
    expect(viewContainer.clear).not.toHaveBeenCalled();
    expect(cdRef.markForCheck).toHaveBeenCalled();

    jest.clearAllMocks();

    authService.isProfessional.mockReturnValue(of(false));
    directive = new ShowIfProfessionalDirective(
      templateRef, viewContainer, authService, cdRef
    );
    directive.ngOnInit();

    expect(viewContainer.clear).toHaveBeenCalled();
    expect(viewContainer.createEmbeddedView).not.toHaveBeenCalled();
    expect(cdRef.markForCheck).toHaveBeenCalled();
  });
});
