import { Validators } from '@angular/forms';

export const FhirStringValidator = Validators.pattern(/^[\r\n\t\u0020-\uFFFF]*$/);
export const CaregiverNamePatternValidator = Validators.pattern(/^[A-Za-zÀ-ÿ -]*$/);
