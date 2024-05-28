import { ErrorHandler, importProvidersFrom } from '@angular/core';
import { createApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { getErrorHandlerFromConfiguration } from '@reuse/code/services/sentry-error-handler.service';
import { WcConfigurationService } from '@reuse/code/services/wc-configuration.service';
import { apiUrlInterceptor } from '@reuse/code/services/api-url.interceptor';
import { createCustomElement } from '@angular/elements';
import { TranslateCompiler, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { WcTranslateLoader } from '@reuse/code/services/translate.loader';
import { TranslateMessageFormatCompiler } from 'ngx-translate-messageformat-compiler';
import { ListPrescriptionsWebComponent } from './components/list-prescriptions/list-prescriptions.component';
import { provideCore } from '@reuse/code/providers/core.provider';
import { ConfigurationService } from '@reuse/code/services/configuration.service';
import { AuthService } from '@reuse/code/services/auth.service';
import { WcAuthService } from '@reuse/code/services/wc-auth.service';

(async () => {
  const app =  createApplication({
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
  const prescriptionListElement = createCustomElement(ListPrescriptionsWebComponent, {
    injector: (await app).injector,
  });
  customElements.define('nihdi-list-referral-prescriptions', prescriptionListElement);
})();
