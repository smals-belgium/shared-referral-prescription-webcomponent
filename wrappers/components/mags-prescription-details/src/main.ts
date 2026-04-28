import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { HOST_SETTINGS } from '@reuse/code/components/wrappers/injection-tokens/host-settings.injection-token';
import { HOST_SERVICES } from '@reuse/code/components/wrappers/injection-tokens/host-services.injection-token';
import { ConfigName, UserLanguage } from '@smals-belgium/myhealth-wc-integration';

bootstrapApplication(App, {
  ...appConfig,
  providers: [
    ...appConfig.providers,
    {
      provide: HOST_SETTINGS,
      useValue: {
        userLanguage: UserLanguage.NL,
        configName: ConfigName.DEMO,
      },
    },
    {
      provide: HOST_SERVICES,
      useValue: {
        events: new EventTarget(),
      },
    },
  ],
}).catch(err => console.error(err));
