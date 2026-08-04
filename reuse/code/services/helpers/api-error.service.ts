import { inject, Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { getErrorBody, resolveErrorKeys } from '@reuse/code/utils/error.utils';
import {
  ApiCode,
  ApiErrorPayload,
  ApiProblem,
  ErrorContext,
  ResolvedError,
} from '@reuse/code/interfaces/error.interface';
import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { AlertType } from '@reuse/code/interfaces';
import { PrescriptionState } from '@reuse/code/states/api/prescription.state';
import { ProposalState } from '@reuse/code/states/api/proposal.state';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '@reuse/code/services/auth/auth.service';
import { Role } from '@reuse/code/openapi';

@Injectable({ providedIn: 'root' })
export class ApiErrorService {
  private readonly translate = inject(TranslateService);
  private readonly prescriptionStateService = inject(PrescriptionState);
  private readonly proposalStateService = inject(ProposalState);
  private readonly authService = inject(AuthService);

  readonly role = toSignal(this.authService.role());

  resolve(error: HttpErrorResponse, errorBody?: unknown): ResolvedError {
    const payload = this.extractPayload(error);
    const ctx = this.deriveContext(payload?.code, errorBody);
    const keys = resolveErrorKeys(payload?.code ?? 'UNKNOWN', ctx);

    return {
      title: 'common.error.default.header',
      subTitle: this.firstAvailableKey(keys),
      errorId: payload?.errorId,
      severity: this.statusToSeverity(payload?.status),
      dismissible: this.statusToDismissible(payload?.status),
      retry: this.statusToRetry(payload?.status),
    };
  }

  private deriveContext(code?: string, errorBody?: unknown): ErrorContext | undefined {
    if (!code || !this.isApiCode(code)) return undefined;

    switch (code) {
      case ApiCode.CANCELLATION_INVALID_STATUS: {
        const resource = this.prescriptionStateService.state()?.data ?? this.proposalStateService.state()?.data;
        return resource ? { serviceRequestStatus: resource.status } : undefined;
      }

      case ApiCode.EXCLUSION_EXISTS_CAREGIVER_TO_ASSIGN: {
        const role = this.role();
        return role ? { role } : undefined;
      }

      case ApiCode.HEALTHCARE_PROFESSIONAL_ALREADY_ASSIGNED: {
        const role = this.extractRoleFromBody(errorBody);
        return role ? { role } : undefined;
      }

      default:
        return undefined;
    }
  }

  private isApiCode(code: string): code is ApiCode {
    return Object.values(ApiCode).includes(code as ApiCode);
  }

  private extractRoleFromBody(errorBody: unknown): Role | undefined {
    if (typeof errorBody !== 'object' || errorBody === null) return undefined;
    if (!('role' in errorBody)) return undefined;
    const raw = (errorBody as { role: unknown }).role;
    return typeof raw === 'string' ? (raw.toLowerCase() as Role) : undefined;
  }

  private statusToRetry(status?: HttpStatusCode): boolean {
    if (status === undefined) return false;

    if (status === HttpStatusCode.Unauthorized || status === HttpStatusCode.Forbidden) {
      return false;
    }

    const status_500 = HttpStatusCode.InternalServerError;
    const status_400 = HttpStatusCode.BadRequest;

    if (status >= status_500) return false;

    if (status >= status_400) return true;

    return false;
  }

  private statusToDismissible(status?: HttpStatusCode): boolean {
    if (status === undefined) return false;

    const status_400 = HttpStatusCode.BadRequest;
    return status < status_400;
  }

  private statusToSeverity(status?: HttpStatusCode): AlertType {
    if (status === undefined) return AlertType.Notification;

    if (status === HttpStatusCode.Unauthorized || status === HttpStatusCode.Forbidden) {
      return AlertType.Warning;
    }

    const status_500 = HttpStatusCode.InternalServerError;
    const status_400 = HttpStatusCode.BadRequest;
    const status_300 = HttpStatusCode.MultipleChoices;
    const status_200 = HttpStatusCode.Ok;

    if (status >= status_500) return AlertType.Error;
    if (status >= status_400) return AlertType.Warning;
    if (status >= status_300) return AlertType.Notification;
    if (status >= status_200) return AlertType.Success;
    return AlertType.Notification;
  }

  private firstAvailableKey(keys: string[]): string {
    for (const key of keys) {
      if (this.hasTranslation(key)) return key;
    }
    return keys.at(-1)!;
  }

  private hasTranslation(key: string): boolean {
    const value = this.translate.instant(key) as string;
    return !!value && value !== key;
  }

  private extractPayload(error: HttpErrorResponse): ApiErrorPayload | undefined {
    const body = getErrorBody(error);
    if (!this.isApiProblem(body)) return undefined;
    const props = body.properties;
    return {
      code: props.code,
      errorId: typeof props.errorId === 'string' ? props.errorId : undefined,
      status: body.status,
    };
  }

  private isApiProblem(value: unknown): value is ApiProblem {
    if (typeof value !== 'object' || value === null) return false;
    const obj = value as Record<string, unknown>;
    const props = obj['properties'];
    if (typeof props !== 'object' || props === null) return false;
    return typeof (props as Record<string, unknown>)['code'] === 'string';
  }
}
