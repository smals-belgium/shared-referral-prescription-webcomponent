import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

import { ApiErrorService } from './api-error.service';
import { PrescriptionState } from '@reuse/code/states/api/prescription.state';
import { ProposalState } from '@reuse/code/states/api/proposal.state';
import { AuthService } from '../auth/auth.service';
import { AlertType } from '@reuse/code/interfaces';

describe('ApiErrorService', () => {
  let service: ApiErrorService;
  let translate: jest.Mocked<TranslateService>;
  let prescriptionState: { state: jest.Mock };
  let proposalState: { state: jest.Mock };
  let authService: { role: jest.Mock };

  beforeEach(() => {
    translate = {
      instant: jest.fn((key: string) => key),
    } as unknown as jest.Mocked<TranslateService>;

    prescriptionState = { state: jest.fn().mockReturnValue(undefined) };
    proposalState = { state: jest.fn().mockReturnValue(undefined) };
    authService = { role: jest.fn().mockReturnValue(of(undefined)) };

    TestBed.configureTestingModule({
      providers: [
        ApiErrorService,
        { provide: TranslateService, useValue: translate },
        { provide: PrescriptionState, useValue: prescriptionState },
        { provide: ProposalState, useValue: proposalState },
        { provide: AuthService, useValue: authService },
      ],
    });
    service = TestBed.inject(ApiErrorService);
  });

  it('falls back to UNKNOWN when the response has no ApiProblem body', () => {
    const error = new HttpErrorResponse({ status: 500, error: 'server not available' });
    const resolved = service.resolve(error);
    expect(resolved.subTitle).toBe('error.api.unknown');
    expect(resolved.errorId).toBeUndefined();
  });

  it('extracts code and errorId from a ProblemDetail response', () => {
    translate.instant.mockImplementation((key: string | string[]) =>
      key === 'error.api.CAREGIVER_NOT_FOUND.default' ? 'Caregiver missing' : key
    );
    const resolved = service.resolve(mockHttpError('CAREGIVER_NOT_FOUND', 404, 'abc-123'));
    expect(resolved.subTitle).toBe('error.api.CAREGIVER_NOT_FOUND.default');
    expect(resolved.errorId).toBe('abc-123');
  });

  it('falls back through the key chain when the specific variant is missing', () => {
    translate.instant.mockImplementation((key: string | string[]) =>
      key === 'error.api.CANCELLATION_INVALID_STATUS.default' ? 'Cannot cancel' : key
    );
    prescriptionState.state.mockReturnValue({ data: { status: 'in-progress' } });

    const resolved = service.resolve(mockHttpError('CANCELLATION_INVALID_STATUS', 400));

    expect(resolved.subTitle).toBe('error.api.CANCELLATION_INVALID_STATUS.default');
  });

  it('picks the in_progress variant when prescription state is IN_PROGRESS', () => {
    translate.instant.mockReturnValue('Cannot cancel because in progress');
    prescriptionState.state.mockReturnValue({ data: { status: 'IN_PROGRESS' } });

    service.resolve(mockHttpError('CANCELLATION_INVALID_STATUS', 400));

    expect(translate.instant).toHaveBeenCalledWith(expect.stringContaining('CANCELLATION_INVALID_STATUS.in-progress'));
  });

  it('uses errorBody role for HEALTHCARE_PROFESSIONAL_ALREADY_ASSIGNED', () => {
    translate.instant.mockImplementation((key: string | string[]) =>
      key === 'error.api.HEALTHCARE_PROFESSIONAL_ALREADY_ASSIGNED.caregiver' ? 'Already assigned' : key
    );

    const resolved = service.resolve(mockHttpError('HEALTHCARE_PROFESSIONAL_ALREADY_ASSIGNED', 400), {
      role: 'CAREGIVER',
    });

    expect(resolved.subTitle).toBe('error.api.HEALTHCARE_PROFESSIONAL_ALREADY_ASSIGNED.caregiver');
  });

  it('falls back to default when errorBody for HEALTHCARE_PROFESSIONAL_ALREADY_ASSIGNED has no role', () => {
    translate.instant.mockImplementation((key: string | string[]) =>
      key === 'error.api.HEALTHCARE_PROFESSIONAL_ALREADY_ASSIGNED.default' ? 'Already assigned' : key
    );

    const resolved = service.resolve(mockHttpError('HEALTHCARE_PROFESSIONAL_ALREADY_ASSIGNED', 400), {
      somethingElse: true,
    });

    expect(resolved.subTitle).toBe('error.api.HEALTHCARE_PROFESSIONAL_ALREADY_ASSIGNED.default');
  });

  it('marks 5xx errors as non-retryable and non-dismissible', () => {
    const resolved = service.resolve(mockHttpError('INTERNAL_ERROR', HttpStatusCode.InternalServerError));
    expect(resolved.severity).toBe(AlertType.Error);
    expect(resolved.retry).toBe(false);
    expect(resolved.dismissible).toBe(false);
  });

  it('marks 4xx errors as retryable and non-dismissible with Warning severity', () => {
    const resolved = service.resolve(mockHttpError('BAD_REQUEST', HttpStatusCode.BadRequest));
    expect(resolved.severity).toBe(AlertType.Warning);
    expect(resolved.retry).toBe(true);
    expect(resolved.dismissible).toBe(false);
  });

  it('treats 401 and 403 as Warning regardless of range default', () => {
    const unauthorized = service.resolve(mockHttpError('UNAUTHORIZED', HttpStatusCode.Unauthorized));
    const forbidden = service.resolve(mockHttpError('FORBIDDEN', HttpStatusCode.Forbidden));
    expect(unauthorized.severity).toBe(AlertType.Warning);
    expect(unauthorized.retry).toBe(false);
    expect(forbidden.severity).toBe(AlertType.Warning);
    expect(forbidden.retry).toBe(false);
  });

  it('returns Notification severity when status is missing', () => {
    const error = new HttpErrorResponse({ status: 0, error: null });
    const resolved = service.resolve(error);
    expect(resolved.severity).toBe(AlertType.Notification);
    expect(resolved.retry).toBe(false);
    expect(resolved.dismissible).toBe(false);
  });

  function mockHttpError(code: string | undefined, status: HttpStatusCode, errorId?: string): HttpErrorResponse {
    return new HttpErrorResponse({
      status,
      error: {
        status,
        properties: {
          ...(code ? { code } : {}),
          ...(errorId ? { errorId } : {}),
        },
      },
    });
  }
});
