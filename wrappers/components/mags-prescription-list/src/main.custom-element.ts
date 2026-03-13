import { createCustomElement } from '@angular/elements';
import { createApplication } from '@angular/platform-browser';

import {
  family,
  HostServices,
  HostSettings,
  type MyHealthModuleBootstrap,
  type MyHealthModuleManifest,
} from '@smals-belgium/myhealth-wc-integration';

import { MagsPrescriptionList } from './app/components/mags/mags-prescription-list.component';
import { appConfig } from './app/app.config';
import { HOST_SETTINGS } from '@reuse/code/components/wrappers/injection-tokens/host-settings.injection-token';
import { HOST_SERVICES } from '@reuse/code/components/wrappers/injection-tokens/host-services.injection-token';
import { importProvidersFrom } from '@angular/core';
import { TranslateCompiler, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { WcTranslateLoader } from '../../../services/translate.loader';
import { TranslateMessageFormatCompiler } from 'ngx-translate-messageformat-compiler';
import { CUSTOM_ELEMENT_NAME_UHMEP_PRESCRIPTION_LIST } from '@reuse/code/constants/common.constants';

export const manifest: MyHealthModuleManifest = {
  specVersion: { major: 4, minor: 0, patch: 1 },
  family: family('uhmep-prescription'),
  components: [
    {
      tagName: CUSTOM_ELEMENT_NAME_UHMEP_PRESCRIPTION_LIST,
      events: ['open'],
      requiredProperties: ['patientSsin'],
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
      importProvidersFrom(
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: WcTranslateLoader },
          compiler: { provide: TranslateCompiler, useClass: TranslateMessageFormatCompiler },
        })
      ),
    ],
  }).then(app => {
    customElements.define(
      CUSTOM_ELEMENT_NAME_UHMEP_PRESCRIPTION_LIST,
      createCustomElement(MagsPrescriptionList, { injector: app.injector })
    );
  });
};
