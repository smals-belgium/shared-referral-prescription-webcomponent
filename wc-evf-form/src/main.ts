import { createApplication } from '@angular/platform-browser';
import { provideEvfForm } from '@reuse/code/evf/evf-form.provider';
import { provideMarkdown } from '@reuse/code/providers/markdown.provider';
import { createCustomElement } from '@angular/elements';
import { EvfFormWebComponent } from './components/evf-form/evf-form.component';
import { provideCore } from '@reuse/code/providers/core.provider';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { apiUrlInterceptor } from "@reuse/code/services/api-url.interceptor";
import { ConfigurationService } from "@reuse/code/services/configuration.service";
import { WcConfigurationService } from "@reuse/code/services/wc-configuration.service";
import { AuthService } from "@reuse/code/services/auth.service";
import { WcAuthService } from "@reuse/code/services/wc-auth.service";
import { ErrorHandler, importProvidersFrom } from "@angular/core";
import { getErrorHandlerFromConfiguration } from "@reuse/code/services/sentry-error-handler.service";
import { TranslateCompiler, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { WcTranslateLoader } from '@reuse/code/services/translate.loader';
import { TranslateMessageFormatCompiler } from 'ngx-translate-messageformat-compiler';

(async () => {
  const app = createApplication({
    providers: [
      provideCore(),
      provideHttpClient(withInterceptors([apiUrlInterceptor])),
      {
        provide: ConfigurationService,
        useClass: WcConfigurationService,
      },
      {
        provide: AuthService,
        useClass: WcAuthService,
      },
      {
        provide: ErrorHandler,
        useFactory: getErrorHandlerFromConfiguration,
        deps: [ConfigurationService]
      },
      provideAnimations(),
      provideEvfForm(),
      provideMarkdown(),
      importProvidersFrom(
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useClass: WcTranslateLoader
          },
          compiler: {
            provide: TranslateCompiler,
            useClass: TranslateMessageFormatCompiler
          }
        }),
      )
    ],
  });
  const evfFormElement = createCustomElement(EvfFormWebComponent, {
    injector: (await app).injector,
  });
  customElements.define('nihdi-referral-prescription-form', evfFormElement);
})();
