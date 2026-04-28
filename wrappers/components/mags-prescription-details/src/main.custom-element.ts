import { createCustomElement } from '@angular/elements';
import { createApplication } from '@angular/platform-browser';

import {
  family,
  HostServices,
  HostSettings,
  type MyHealthModuleBootstrap,
  type MyHealthModuleManifest,
} from '@smals-belgium/myhealth-wc-integration';

import { MagsPrescriptionDetails } from './app/components/mags/mags-prescription-details.component';
import { appConfig } from './app/app.config';
import { HOST_SETTINGS } from '@reuse/code/components/wrappers/injection-tokens/host-settings.injection-token';
import { HOST_SERVICES } from '@reuse/code/components/wrappers/injection-tokens/host-services.injection-token';
import { CUSTOM_ELEMENT_NAME_UHMEP_PRESCRIPTION_DETAILS } from '@reuse/code/constants/common.constants';

export const manifest: MyHealthModuleManifest = {
  specVersion: { major: 4, minor: 0, patch: 1 },
  family: family('uhmep-prescription'),
  components: [
    {
      tagName: CUSTOM_ELEMENT_NAME_UHMEP_PRESCRIPTION_DETAILS,
      events: ['print', 'open'],
      requiredProperties: ['prescriptionId', 'intent'],
    },
  ],
};

export const bootstrap: MyHealthModuleBootstrap = (config: { services: HostServices; settings: HostSettings }) => {
  createApplication({
    ...appConfig,
    providers: [
      ...appConfig.providers,
      { provide: HOST_SETTINGS, useValue: config.settings },
      { provide: HOST_SERVICES, useValue: config.services },
    ],
  }).then(app => {
    customElements.define(
      CUSTOM_ELEMENT_NAME_UHMEP_PRESCRIPTION_DETAILS,
      createCustomElement(MagsPrescriptionDetails, { injector: app.injector })
    );
  });
};
