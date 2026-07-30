import { ApiCode, ErrorContext } from '@reuse/code/interfaces/error.interface';
import { HttpErrorResponse } from '@angular/common/http';
import { RequestStatus, Role } from '@reuse/code/openapi';

const KEY_PREFIX = 'error.api';

const RESOLVERS: Partial<Record<ApiCode, (ctx?: ErrorContext) => string | null>> = {
  [ApiCode.CANCELLATION_INVALID_STATUS]: ctx => {
    switch (ctx?.serviceRequestStatus) {
      case RequestStatus.InProgress:
        return `${KEY_PREFIX}.CANCELLATION_INVALID_STATUS.in-progress`;
      case RequestStatus.Done:
        return `${KEY_PREFIX}.CANCELLATION_INVALID_STATUS.completed`;
      default:
        return null;
    }
  },
  [ApiCode.EXCLUSION_EXISTS_CAREGIVER_TO_ASSIGN]: ctx => {
    switch (ctx?.role) {
      case Role.Patient:
        return `${KEY_PREFIX}.EXCLUSION_EXISTS_CAREGIVER_TO_ASSIGN.patient`;
      case Role.Caregiver:
      case Role.Prescriber:
        return `${KEY_PREFIX}.CANCELLATION_NOT_POSSIBLE.healthcare-provider`;
      default:
        return null;
    }
  },
  [ApiCode.HEALTHCARE_PROFESSIONAL_ALREADY_ASSIGNED]: ctx => {
    switch (ctx?.role) {
      case Role.Caregiver:
        return `${KEY_PREFIX}.HEALTHCARE_PROFESSIONAL_ALREADY_ASSIGNED.caregiver`;
      case Role.Prescriber:
        return `${KEY_PREFIX}.HEALTHCARE_PROFESSIONAL_ALREADY_ASSIGNED.prescriber`;
      default:
        return null;
    }
  },
};

export function resolveErrorKeys(code: string, subCode?: ErrorContext): string[] {
  const specific = RESOLVERS[code as ApiCode]?.(subCode) ?? null;
  return [...(specific ? [specific] : []), `${KEY_PREFIX}.${code}.default`, `${KEY_PREFIX}.unknown`];
}

export function getErrorBody(error: HttpErrorResponse): unknown {
  return error.error;
}
