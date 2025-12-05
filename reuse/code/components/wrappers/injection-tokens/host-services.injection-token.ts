import { InjectionToken } from '@angular/core';
import { HostServices } from '@smals-belgium/myhealth-wc-integration';

export const HOST_SERVICES = new InjectionToken<HostServices>('HostServices');
