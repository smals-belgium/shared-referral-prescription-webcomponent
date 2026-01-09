import { TemplateRef } from '@angular/core';
import { AuthService } from '@reuse/code/services/auth/auth.service';

export function createDirectiveMocks() {
  const viewContainer = {
    createEmbeddedView: jest.fn(),
    clear: jest.fn(),
  } as any;

  const templateRef = {} as TemplateRef<any>;

  const cdRef = {
    markForCheck: jest.fn(),
  } as any;

  const authService = {
    isProfessional: jest.fn(),
  } as unknown as jest.Mocked<AuthService>;

  return { templateRef, viewContainer, authService, cdRef };
}
