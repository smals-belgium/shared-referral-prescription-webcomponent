import { ErrorHandler, importProvidersFrom } from '@angular/core';
import { createApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { getErrorHandlerFromConfiguration } from '@reuse/code/services/helpers/sentry-error-handler.service';
import { WcConfigurationService } from '@reuse/code/services/config/wc-configuration.service';
import { apiUrlInterceptor } from '@reuse/code/interceptors/api-url.interceptor';
import { createCustomElement } from '@angular/elements';
import { TranslateCompiler, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { WcTranslateLoader } from '@reuse/code/services/helpers/translate.loader';
import { TranslateMessageFormatCompiler } from 'ngx-translate-messageformat-compiler';
import { ListPrescriptionsWebComponent } from './components/list-prescriptions/list-prescriptions.component';
import { provideCore } from '@reuse/code/providers/core.provider';
import { ConfigurationService } from '@reuse/code/services/config/configuration.service';
import { AuthService } from '@reuse/code/services/auth/auth.service';
import { WcAuthService } from '@reuse/code/services/auth/wc-auth.service';
import { providePseudonymisation } from '@reuse/code/providers/pseudo.provider';
import { provideOpenApi } from '@reuse/code/providers/open-api.provider';

(async () => {
  const app = createApplication({
    providers: [
      provideCore(),
      provideHttpClient(withInterceptors([apiUrlInterceptor])),
      providePseudonymisation(),
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
  const prescriptionListElement = createCustomElement(ListPrescriptionsWebComponent, {
    injector: (await app).injector,
  });
  customElements.define('nihdi-referral-prescription-list', prescriptionListElement);
})();
