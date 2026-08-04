import { HttpContextToken } from '@angular/common/http';
import { InjectionToken } from '@angular/core';

export const SKIP_ERROR_HANDLING = new HttpContextToken<boolean>(() => false);
export const ERROR_PRESCRIPTION_DETAILS = 'prescription-details';
export const ERROR_CREATE_PRESCRIPTION = 'create-prescription';
export const ERROR_PRESCRIPTION_LIST = 'prescription-list';

export const ALERT_TARGET = new InjectionToken<string>('ALERT_TARGET');
