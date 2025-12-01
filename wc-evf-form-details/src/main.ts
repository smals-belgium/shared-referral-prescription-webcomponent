import { createApplication } from '@angular/platform-browser';
import { provideEvfFormDetails } from '@reuse/code/evf/evf-form-details.provider';
import { provideMarkdown } from '@reuse/code/providers/markdown.provider';
import { createCustomElement } from '@angular/elements';
import { provideCore } from '@reuse/code/providers/core.provider';
import { provideAnimations } from '@angular/platform-browser/animations';
import { EvfFormDetailsWebComponent } from './components/evf-details/evf-form-details.component';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ErrorHandler, importProvidersFrom } from '@angular/core';
import { TranslateCompiler, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { WcTranslateLoader } from '@reuse/code/services/helpers/translate.loader';
import { TranslateMessageFormatCompiler } from 'ngx-translate-messageformat-compiler';
import { apiUrlInterceptor } from '@reuse/code/interceptors/api-url.interceptor';
import { ConfigurationService } from '@reuse/code/services/config/configuration.service';
import { WcConfigurationService } from '@reuse/code/services/config/wc-configuration.service';
import { AuthService } from '@reuse/code/services/auth/auth.service';
import { WcAuthService } from '@reuse/code/services/auth/wc-auth.service';
import { getErrorHandlerFromConfiguration } from '@reuse/code/services/helpers/sentry-error-handler.service';
import { provideOpenApi } from '@reuse/code/providers/open-api.provider';
import { demoHttpInterceptor } from '@reuse/code/demo/demo-http.interceptor';

(async () => {
  const app = createApplication({
    providers: [
      provideCore(),
      provideAnimations(),
      provideHttpClient(withInterceptors([demoHttpInterceptor, apiUrlInterceptor])),
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
        deps: [ConfigurationService],
      },
      provideOpenApi(),
      provideEvfFormDetails(),
      provideMarkdown(),
      importProvidersFrom(
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useClass: WcTranslateLoader,
          },
          compiler: {
            provide: TranslateCompiler,
            useClass: TranslateMessageFormatCompiler,
          },
        })
      ),
    ],
  });

  const evfFormElement = createCustomElement(EvfFormDetailsWebComponent, {
    injector: (await app).injector,
  });
  customElements.define('nihdi-referral-prescription-form-details', evfFormElement);
})();
